import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

/**
 * POST /api/workiq
 *
 * Queries Microsoft WorkIQ (M365 Copilot data — meetings, emails, Teams,
 * documents) using the CLI and returns AI-distilled topic suggestions the
 * user can turn into social posts.
 *
 * Body: { question?: string }
 * Response: { suggestions: string[], raw: string }
 */

const DEFAULT_QUESTION =
  'Based on my recent meetings, emails, and Teams discussions from the past week, ' +
  'what are the top 5 professional topics or themes I have been most involved with? ' +
  'Return ONLY a JSON array of 5 short topic strings (each under 60 characters), ' +
  'suitable as social media post topics for a Microsoft employee. ' +
  'Example format: ["Topic one","Topic two","Topic three","Topic four","Topic five"]';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const question: string = body.question || DEFAULT_QUESTION;

    const rawText = await runWorkIQQuery(question);
    const suggestions = extractSuggestions(rawText);

    return NextResponse.json({ suggestions, raw: rawText });
  } catch (error: any) {
    console.error('[workiq] Error:', error.message);
    return NextResponse.json(
      {
        error: 'Failed to query WorkIQ',
        details: error.message,
        suggestions: getFallbackSuggestions(),
      },
      { status: 500 }
    );
  }
}

/**
 * Spawn `npx -y @microsoft/workiq ask -q "..."` and capture its stdout.
 *
 * IMPORTANT: WorkIQ requires stdin to be inherited (TTY detection). Without
 * it, the CLI exits with code 0 but produces zero output. We pass
 * `stdio: ['inherit', 'pipe', 'pipe']` so the child process inherits the
 * server's stdin (which is connected to a terminal when running `next dev`).
 */
function runWorkIQQuery(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const safeQ = question.replace(/"/g, '\\"');
    const proc = spawn(
      'npx',
      ['-y', '@microsoft/workiq', 'ask', '-q', `"${safeQ}"`],
      {
        shell: true,
        env: { ...process.env },
        stdio: ['inherit', 'pipe', 'pipe'],
      },
    );

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });
    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    const timeout = setTimeout(() => {
      try { proc.kill(); } catch { /* ignore */ }
      reject(new Error('WorkIQ query timed out after 90 seconds'));
    }, 90_000);

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (stdout.trim()) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`WorkIQ exited with code ${code}: ${stderr.slice(0, 500)}`));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

/**
 * Parse a JSON array of topic strings from the WorkIQ response.
 * The LLM may wrap the array in markdown fences or surrounding prose.
 */
function extractSuggestions(text: string): string[] {
  // Strategy 1: Find a JSON array anywhere in the text
  const arrayMatch = text.match(/\[[\s\S]*?\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed) && parsed.every((s) => typeof s === 'string')) {
        return parsed.slice(0, 5);
      }
    } catch { /* fall through */ }
  }

  // Strategy 2: Extract numbered/bulleted items
  const lines = text.split('\n');
  const items: string[] = [];
  for (const line of lines) {
    const cleaned = line
      .replace(/^[\s\-*•\d.]+/, '')
      .replace(/\*\*/g, '')
      .trim();
    if (cleaned.length > 10 && cleaned.length < 80 && !cleaned.startsWith('##')) {
      items.push(cleaned);
    }
    if (items.length >= 5) break;
  }

  if (items.length >= 3) return items.slice(0, 5);

  // Strategy 3: Fallback
  return getFallbackSuggestions();
}

function getFallbackSuggestions(): string[] {
  return [
    'AI adoption challenges and change management',
    'Customer Zero initiative and use-case mapping',
    'Azure platform delivery and networking',
    'AI agent development and enablement',
    'Cloud-native infrastructure trends',
  ];
}
