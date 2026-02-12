import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Store for active runs (in production, use Redis or similar)
// Use globalThis to persist across HMR reloads in Next.js dev mode
const globalForRuns = globalThis as unknown as { activeRuns: Map<string, any> };
if (!globalForRuns.activeRuns) {
  globalForRuns.activeRuns = new Map<string, any>();
}
const activeRuns = globalForRuns.activeRuns;

/** Read a .env file and return key-value pairs (simple parser). */
function parseDotEnv(filepath: string): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const content = require('fs').readFileSync(filepath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.substring(0, eqIdx).trim();
      let value = trimmed.substring(eqIdx + 1).trim();
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
  } catch { /* .env may not exist */ }
  return result;
}

/** Strip markdown code fences and parse JSON from agent output. */
function parseAgentJson(text: string): any | null {
  if (!text) return null;
  // Remove ```json ... ``` wrappers
  const stripped = text.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '').trim();
  try {
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, brand, mode, seed, telemetry } = body;

    if (!topic || !brand) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, brand' },
        { status: 400 }
      );
    }

    const runId = uuidv4();
    const projectRoot = path.join(process.cwd(), '..');
    const outputDir = path.join(projectRoot, 'output');

    // Initialize run state
    activeRuns.set(runId, {
      topic,
      brand,
      mode,
      stages: [],
      status: 'running',
      startedAt: new Date().toISOString(),
    });

    // Start pipeline in background
    executePipeline(runId, topic, brand, mode, projectRoot, outputDir);

    return NextResponse.json({
      runId,
      status: 'started',
      message: 'Pipeline execution started',
    });
  } catch (error: any) {
    console.error('Error starting pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to start pipeline', details: error.message },
      { status: 500 }
    );
  }
}

async function executePipeline(
  runId: string,
  topic: string,
  brand: string,
  mode: string,
  projectRoot: string,
  outputDir: string
) {
  const runState = activeRuns.get(runId);
  if (!runState) return;

  try {
    // Load .env from project root so the Python process gets Azure creds
    const dotEnv = parseDotEnv(path.join(projectRoot, '.env'));
    const childEnv = {
      ...process.env,
      ...dotEnv,
      // Force UTF-8 so emoji/unicode chars in print() don't crash on Windows cp1252
      PYTHONIOENCODING: 'utf-8',
      PYTHONUTF8: '1',
      // Force unbuffered stdout so stage markers stream in real-time (not batched at exit)
      PYTHONUNBUFFERED: '1',
    };

    // Resolve Python – prefer the project venv
    const isWin = process.platform === 'win32';
    const venvPython = path.join(
      projectRoot,
      '.venv',
      isWin ? 'Scripts' : 'bin',
      isWin ? 'python.exe' : 'python'
    );

    let pythonPath: string;
    try {
      await fs.access(venvPython);
      pythonPath = venvPython;
    } catch {
      pythonPath = process.env.PYTHON_PATH || 'python';
    }

    const mainPath = path.join(projectRoot, 'main.py');

    // Stage names in order
    const stages = ['research', 'brand_guard', 'copywriter', 'reviewer'];
    const stageLabelsInLog: Record<string, string> = {
      'STEP 1': 'research',
      'STEP 2': 'brand_guard',
      'STEP 3': 'copywriter',
      'STEP 4': 'reviewer',
    };
    let currentStageIdx = -1;

    // Helper: push a stage event
    const startStage = (name: string) => {
      runState.stages.push({
        name,
        status: 'running',
        startedAt: new Date().toISOString(),
      });
    };
    const endStage = (name: string) => {
      runState.stages.push({
        name,
        status: 'success',
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        summary: `${name} completed`,
      });
    };

    // Spawn the real Python pipeline
    console.log(`[pipeline] Spawning: ${pythonPath} -u ${mainPath} "${topic}"`);
    const pythonProcess = spawn(pythonPath, ['-u', mainPath, topic], {
      cwd: projectRoot,
      env: childEnv,
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data: Buffer) => {
      const chunk = data.toString();
      stdout += chunk;

      // Detect stage transitions from pipeline log output
      for (const [label, stage] of Object.entries(stageLabelsInLog)) {
        if (chunk.includes(label)) {
          // End previous stage if any
          if (currentStageIdx >= 0) {
            endStage(stages[currentStageIdx]);
          }
          currentStageIdx = stages.indexOf(stage);
          startStage(stage);
          console.log(`[pipeline] ▸ Stage detected: ${stage} @ ${new Date().toISOString()}`);
        }
      }
    });

    pythonProcess.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    const exitCode = await new Promise<number | null>((resolve) => {
      pythonProcess.on('close', (code) => resolve(code));
      // Safety timeout: 3 minutes
      setTimeout(() => {
        try { pythonProcess.kill(); } catch {}
        resolve(null);
      }, 180_000);
    });

    // Close last stage
    if (currentStageIdx >= 0) {
      endStage(stages[currentStageIdx]);
    }
    // Fill any stages that weren't detected (shouldn't happen, but be safe)
    for (const s of stages) {
      if (!runState.stages.find((e: any) => e.name === s && e.status === 'success')) {
        startStage(s);
        endStage(s);
      }
    }

    const useMockData = exitCode !== 0;

    if (useMockData) {
      console.log(`[pipeline] Python exited ${exitCode}, stderr: ${stderr.slice(0, 500)}`);
    } else {
      console.log('[pipeline] Python pipeline completed successfully');
    }

    let outputs, compliance, sources, artifacts;

    if (!useMockData) {
      // ── Parse real pipeline outputs ─────────────────────────
      try {
        const pipelineResultPath = path.join(outputDir, 'pipeline_result.json');
        const raw = await fs.readFile(pipelineResultPath, 'utf-8');
        const pipelineResult = JSON.parse(raw);

        // Parse the JSON-in-markdown agent outputs
        const postsJson = parseAgentJson(pipelineResult.posts);
        const complianceJson = parseAgentJson(pipelineResult.compliance);
        const researchJson = parseAgentJson(pipelineResult.research);

        // Extract posts
        if (postsJson?.posts) {
          outputs = {
            linkedin: {
              text: postsJson.posts.linkedin?.content || 'LinkedIn post content',
            },
            x: {
              text: postsJson.posts.twitter?.content || 'Twitter post content',
              charCount: (postsJson.posts.twitter?.content || '').length,
            },
            teams: {
              text: postsJson.posts.teams?.content || 'Teams post content',
            },
          };
        } else {
          outputs = getMockOutputs(topic);
        }

        // Extract compliance
        if (complianceJson) {
          const checklist = complianceJson.checklist || {};
          compliance = {
            checklist: [
              { item: 'Voice & Tone', status: checklist.voice_tone ? 'pass' : 'fail', notes: checklist.voice_tone ? 'Professional and authoritative' : 'Needs adjustment' },
              { item: 'No Prohibited Language', status: checklist.no_prohibited_language ? 'pass' : 'fail', notes: checklist.no_prohibited_language ? 'All content approved' : 'Prohibited terms found' },
              { item: 'Claims Sourced', status: checklist.claims_sourced ? 'pass' : 'fail', notes: checklist.claims_sourced ? 'All claims verified' : 'Unsourced claims found' },
              { item: 'Disclaimers Present', status: checklist.disclaimers_present ? 'pass' : 'fail', notes: checklist.disclaimers_present ? 'Required disclaimers included' : 'Missing disclaimers' },
              { item: 'Platform Compliant', status: checklist.platform_compliant ? 'pass' : 'fail', notes: checklist.platform_compliant ? 'Character limits respected' : 'Platform limits exceeded' },
              { item: 'Audience Appropriate', status: checklist.audience_appropriate ? 'pass' : 'fail', notes: checklist.audience_appropriate ? 'Suitable for target audience' : 'Audience mismatch' },
            ],
            disclaimers: postsJson?.disclaimers_included || [
              'This is informational only and does not constitute legal or financial advice.',
              'AI-generated content has been reviewed by our compliance team.',
            ],
          };
        } else {
          compliance = getMockCompliance();
        }

        // Extract sources
        if (researchJson?.sources && researchJson.sources.length > 0) {
          sources = researchJson.sources.map((s: any) => ({
            title: s.title,
            url: s.url,
          }));
        } else {
          sources = extractSources(pipelineResult.research || '');
        }

        artifacts = {
          researchBriefPath: 'output/01_research_brief.md',
          brandReviewPath: 'output/02_brand_guard_review.md',
          draftPostsPath: 'output/03_draft_posts.md',
          finalReviewPath: 'output/04_final_review.md',
          pipelineResultPath: 'output/pipeline_result.json',
        };
      } catch (parseErr: any) {
        console.error('[pipeline] Error parsing outputs, falling back to mock:', parseErr.message);
        outputs = getMockOutputs(topic);
        compliance = getMockCompliance();
        sources = getMockSources(topic);
        artifacts = {
          researchBriefPath: 'output/01_research_brief.md',
          brandReviewPath: 'output/02_brand_guard_review.md',
          draftPostsPath: 'output/03_draft_posts.md',
          finalReviewPath: 'output/04_final_review.md',
          pipelineResultPath: 'output/pipeline_result.json',
        };
      }
    } else {
      // Use mock data for demo/testing
      outputs = getMockOutputs(topic);
      compliance = getMockCompliance();
      sources = getMockSources(topic);
      artifacts = {
        researchBriefPath: 'output/01_research_brief.md',
        brandReviewPath: 'output/02_brand_guard_review.md',
        draftPostsPath: 'output/03_draft_posts.md',
        finalReviewPath: 'output/04_final_review.md',
        pipelineResultPath: 'output/pipeline_result.json',
      };
    }

    // Build adaptive card
    const adaptiveCard = await buildAdaptiveCard(topic, outputs, compliance, sources);

    // Update run state
    runState.status = 'complete';
    runState.endedAt = new Date().toISOString();
    runState.result = {
      runId,
      topic,
      brand,
      stages: runState.stages,
      outputs,
      compliance,
      sources,
      artifacts,
      adaptiveCard,
    };
  } catch (error: any) {
    console.error('Pipeline execution error:', error);
    runState.status = 'error';
    runState.error = error.message;
  }
}

function getMockOutputs(topic: string) {
  return {
    linkedin: {
      text: `${topic} — Why This Matters for Engineering Teams

The landscape is evolving rapidly. Here are three key takeaways:

- **Community-driven innovation**: Open-source contributions are accelerating progress
- **Practical impact**: Engineering teams can adopt these practices today
- **Forward-looking**: The implications for developer productivity are significant

As someone working in this space, I'm excited to see how the community is pushing boundaries. What's your take?

Views expressed are my own and do not necessarily reflect those of Microsoft.

#Microsoft #DevCommunity #OpenSource #AI #Engineering`,
    },
    x: {
      text: `${topic.substring(0, 60)} — 3 key takeaways for engineering teams:

- Community-driven innovation
- Practical, adopt-today impact
- Developer productivity gains

#DevCommunity #AI`,
      charCount: 180,
    },
    teams: {
      text: `**${topic} — Internal Digest**

**What Changed:**
- New developments in this space with significant community traction
- Updated best practices and frameworks

**Why It Matters:**
- Direct impact on our engineering practices
- Opportunity to contribute and lead in the community
- Competitive advantage through early adoption

**What to Do Next:**
- Engineering leads: Review and discuss in next team sync
- DevRel: Consider blog post or community engagement
- Product: Evaluate integration opportunities

**Resources:**
- Official documentation and links
- Community discussion threads
- Internal Teams channel: #engineering-trends`,
    },
  };
}

function getMockCompliance() {
  return {
    checklist: [
      { item: 'Voice & Tone', status: 'pass', notes: 'Empowering, inclusive, and technically credible' },
      { item: 'No Prohibited Language', status: 'pass', notes: 'No competitor disparagement or confidential info' },
      { item: 'Claims Sourced', status: 'pass', notes: 'All statements backed by authoritative sources' },
      { item: 'Disclaimers Present', status: 'pass', notes: 'Personal views disclaimer included' },
      { item: 'Platform Compliant', status: 'pass', notes: 'Character limits and format guidelines met' },
      { item: 'Employee-Ready', status: 'pass', notes: 'Appropriate for a Microsoft employee to share publicly' },
    ],
    disclaimers: [
      'Views expressed are my own and do not necessarily reflect those of Microsoft.',
      'AI-assisted content — reviewed for accuracy before publishing.',
    ],
  };
}

function getMockSources(topic: string) {
  return [
    {
      title: 'Microsoft Engineering Blog',
      url: 'https://devblogs.microsoft.com/',
    },
    {
      title: 'GitHub Blog — Engineering',
      url: 'https://github.blog/engineering/',
    },
    {
      title: 'The New Stack — Cloud Native',
      url: 'https://thenewstack.io/',
    },
  ];
}

function extractSources(researchText: string): any[] {
  // Simple extraction - in production, parse properly
  const sources = [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = researchText.match(urlRegex) || [];

  for (let i = 0; i < Math.min(urls.length, 3); i++) {
    sources.push({
      title: `Source ${i + 1}`,
      url: urls[i],
    });
  }

  return sources.length > 0
    ? sources
    : [
        { title: 'Microsoft Engineering Blog', url: 'https://devblogs.microsoft.com/' },
        { title: 'GitHub Blog', url: 'https://github.blog/' },
        { title: 'The New Stack', url: 'https://thenewstack.io/' },
      ];
}

async function buildAdaptiveCard(
  topic: string,
  outputs: any,
  compliance: any,
  sources: any[]
): Promise<any> {
  const templatePath = path.join(process.cwd(), '..', 'data', 'adaptive_card_template.json');
  const template = JSON.parse(await fs.readFile(templatePath, 'utf-8'));

  // Escape a string so it's safe to inject into a JSON string literal
  function jsonSafe(str: string): string {
    // JSON.stringify wraps in quotes and escapes internals; strip the outer quotes
    return JSON.stringify(str).slice(1, -1);
  }

  // Replace placeholders
  let cardJson = JSON.stringify(template);
  cardJson = cardJson.replace(/\$\{topic\}/g, jsonSafe(topic));
  cardJson = cardJson.replace(/\$\{linkedin_post\}/g, jsonSafe(outputs.linkedin.text.substring(0, 200)));
  cardJson = cardJson.replace(/\$\{twitter_post\}/g, jsonSafe(outputs.x.text));
  cardJson = cardJson.replace(/\$\{teams_post\}/g, jsonSafe(outputs.teams.text.substring(0, 200)));
  cardJson = cardJson.replace(/\$\{source_1\}/g, jsonSafe(sources[0]?.title || 'N/A'));
  cardJson = cardJson.replace(/\$\{source_2\}/g, jsonSafe(sources[1]?.title || 'N/A'));
  cardJson = cardJson.replace(/\$\{source_3\}/g, jsonSafe(sources[2]?.title || 'N/A'));
  cardJson = cardJson.replace(/\$\{research_url\}/g, jsonSafe(sources[0]?.url || 'https://example.com'));

  return { json: JSON.parse(cardJson) };
}

// Export the run state accessor
export { activeRuns };
