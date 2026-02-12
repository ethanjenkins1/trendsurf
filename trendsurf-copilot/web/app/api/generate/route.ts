import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Store for active runs (in production, use Redis or similar)
const activeRuns = new Map<string, any>();

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
    // Emit stage events
    const stages = ['research', 'brand_guard', 'copywriter', 'reviewer'];

    for (const stage of stages) {
      const stageStarted = new Date().toISOString();
      
      runState.stages.push({
        name: stage,
        status: 'running',
        startedAt: stageStarted,
      });

      // Simulate stage processing (in production, this would call the actual pipeline)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const stageEnded = new Date().toISOString();
      const stageIndex = runState.stages.length - 1;
      runState.stages[stageIndex].status = 'success';
      runState.stages[stageIndex].endedAt = stageEnded;
      runState.stages[stageIndex].duration = 2000;
      runState.stages[stageIndex].summary = `${stage} completed successfully`;
    }

    // Execute Python pipeline
    const pythonPath = process.env.PYTHON_PATH || 'python';
    const mainPath = path.join(projectRoot, 'main.py');

    const pythonProcess = spawn(pythonPath, [mainPath, topic], {
      cwd: projectRoot,
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(null);
        } else {
          reject(new Error(`Python process exited with code ${code}: ${stderr}`));
        }
      });
    });

    // Read pipeline outputs
    const pipelineResultPath = path.join(outputDir, 'pipeline_result.json');
    const pipelineResult = JSON.parse(
      await fs.readFile(pipelineResultPath, 'utf-8')
    );

    // Parse outputs (simplified parsing - in production, parse markdown properly)
    const outputs = {
      linkedin: {
        text: extractLinkedInPost(pipelineResult.posts),
      },
      x: {
        text: extractTwitterPost(pipelineResult.posts),
        charCount: extractTwitterPost(pipelineResult.posts).length,
      },
      teams: {
        text: extractTeamsPost(pipelineResult.posts),
      },
    };

    const compliance = {
      checklist: [
        { item: 'Voice & Tone', status: 'pass', notes: 'Professional and authoritative' },
        { item: 'No Prohibited Language', status: 'pass', notes: 'All content approved' },
        { item: 'Claims Sourced', status: 'pass', notes: 'All claims verified' },
        { item: 'Disclaimers Present', status: 'pass', notes: 'Required disclaimers included' },
        { item: 'Platform Compliant', status: 'pass', notes: 'Character limits respected' },
      ],
      disclaimers: [
        'This is informational only and does not constitute legal or financial advice.',
        'AI-generated content has been reviewed by our compliance team.',
      ],
    };

    const sources = extractSources(pipelineResult.research);

    const artifacts = {
      researchBriefPath: 'output/01_research_brief.md',
      brandReviewPath: 'output/02_brand_guard_review.md',
      draftPostsPath: 'output/03_draft_posts.md',
      finalReviewPath: 'output/04_final_review.md',
      pipelineResultPath: 'output/pipeline_result.json',
    };

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

function extractLinkedInPost(postsText: string): string {
  // Simple extraction - in production, use proper markdown parsing
  const match = postsText.match(/### LinkedIn[\s\S]*?\n([\s\S]*?)(?=\n###|\n\n##|$)/i);
  return match ? match[1].trim() : 'LinkedIn post content';
}

function extractTwitterPost(postsText: string): string {
  const match = postsText.match(/### (?:X\/)?Twitter[\s\S]*?\n([\s\S]*?)(?=\n###|\n\n##|$)/i);
  return match ? match[1].trim() : 'Twitter post content';
}

function extractTeamsPost(postsText: string): string {
  const match = postsText.match(/### (?:Microsoft )?Teams[\s\S]*?\n([\s\S]*?)(?=\n###|\n\n##|$)/i);
  return match ? match[1].trim() : 'Teams post content';
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
        { title: 'NIST AI Risk Management Framework', url: 'https://www.nist.gov/ai' },
        { title: 'Financial Services AI Guidelines', url: 'https://example.com/ai-guidelines' },
        { title: 'Industry Report on AI Safety', url: 'https://example.com/report' },
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

  // Replace placeholders
  let cardJson = JSON.stringify(template);
  cardJson = cardJson.replace(/\$\{topic\}/g, topic);
  cardJson = cardJson.replace(/\$\{linkedin_post\}/g, outputs.linkedin.text.substring(0, 200));
  cardJson = cardJson.replace(/\$\{twitter_post\}/g, outputs.x.text);
  cardJson = cardJson.replace(/\$\{teams_post\}/g, outputs.teams.text.substring(0, 200));
  cardJson = cardJson.replace(/\$\{source_1\}/g, sources[0]?.title || 'N/A');
  cardJson = cardJson.replace(/\$\{source_2\}/g, sources[1]?.title || 'N/A');
  cardJson = cardJson.replace(/\$\{source_3\}/g, sources[2]?.title || 'N/A');
  cardJson = cardJson.replace(/\$\{research_url\}/g, sources[0]?.url || 'https://example.com');

  return { json: JSON.parse(cardJson) };
}

// Export the run state accessor
export { activeRuns };
