import { NextRequest } from 'next/server';
import { activeRuns } from '../../../generate/route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  // Set up SSE headers
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const runState = activeRuns.get(runId);

      if (!runState) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: 'Run not found' })}\n\n`
          )
        );
        controller.close();
        return;
      }

      let lastStageCount = 0;

      // Poll for updates
      const interval = setInterval(() => {
        const currentRunState = activeRuns.get(runId);

        if (!currentRunState) {
          clearInterval(interval);
          controller.close();
          return;
        }

        // Send new stage events
        if (currentRunState.stages.length > lastStageCount) {
          const newStages = currentRunState.stages.slice(lastStageCount);
          newStages.forEach((stage: any) => {
            const event = {
              type: 'stage_event',
              runId,
              stage: stage.name,
              status: stage.status,
              summary: stage.summary,
              timestamps: {
                startedAt: stage.startedAt,
                endedAt: stage.endedAt,
                duration: stage.duration,
              },
              artifactPaths: {
                output: `output/${stage.name}.md`,
              },
              input: {},
              output: {},
              artifacts: {},
              citations: [],
            };

            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          });

          lastStageCount = currentRunState.stages.length;
        }

        // Send completion event
        if (currentRunState.status === 'complete' && currentRunState.result) {
          const completeEvent = {
            type: 'complete',
            runId,
            result: currentRunState.result,
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(completeEvent)}\n\n`));
          clearInterval(interval);
          controller.close();
        }

        // Send error event
        if (currentRunState.status === 'error') {
          const errorEvent = {
            type: 'error',
            runId,
            message: currentRunState.error || 'Unknown error',
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
          clearInterval(interval);
          controller.close();
        }
      }, 500);

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
