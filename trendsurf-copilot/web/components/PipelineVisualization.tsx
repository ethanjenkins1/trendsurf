'use client';

import { useState, useEffect } from 'react';

interface PipelineVisualizationProps {
  mode: 'tourist' | 'purist';
  stageEvents: any[];
  isRunning: boolean;
}

interface NodeStatus {
  status: 'idle' | 'running' | 'success' | 'warning' | 'error';
  summary?: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  artifactPath?: string;
}

const STAGES = ['input', 'research', 'brand_guard', 'copywriter', 'reviewer', 'output'];

export default function PipelineVisualization({
  mode,
  stageEvents,
  isRunning,
}: PipelineVisualizationProps) {
  const [nodeStates, setNodeStates] = useState<Record<string, NodeStatus>>({});
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [packetPosition, setPacketPosition] = useState(0);

  useEffect(() => {
    const states: Record<string, NodeStatus> = {
      input: { status: isRunning ? 'success' : 'idle' },
      research: { status: 'idle' },
      brand_guard: { status: 'idle' },
      copywriter: { status: 'idle' },
      reviewer: { status: 'idle' },
      output: { status: 'idle' },
    };

    stageEvents.forEach((event) => {
      if (event.stage) {
        states[event.stage] = {
          status: event.status,
          summary: event.summary,
          startedAt: event.timestamps?.startedAt,
          endedAt: event.timestamps?.endedAt,
          duration: event.timestamps?.duration,
          artifactPath: event.artifactPaths?.output,
        };
      }
    });

    if (!isRunning && stageEvents.length > 0) {
      states.output = { status: 'success' };
      setPacketPosition(6);
    } else if (isRunning) {
      const completedStages = stageEvents.filter(
        (e) => e.status === 'success' || e.status === 'warning'
      ).length;
      setPacketPosition(completedStages + 1);
    }

    setNodeStates(states);
  }, [stageEvents, isRunning]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'success':
        return 'border-green-500 bg-green-500/10';
      case 'warning':
        return 'border-orange-500 bg-orange-500/10';
      case 'error':
        return 'border-red-500 bg-red-500/10';
      default:
        return 'border-zinc-700 bg-zinc-800/30';
    }
  };

  const getNodeLabel = (stage: string) => {
    const labels: Record<string, string> = {
      input: 'INPUT',
      research: 'RESEARCH',
      brand_guard: 'BRAND_GUARD',
      copywriter: 'COPYWRITER',
      reviewer: 'REVIEWER',
      output: 'OUTPUT',
    };
    return labels[stage] || stage.toUpperCase();
  };

  return (
    <section className="mb-16" data-testid="pipeline-visualization">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2 font-mono">PIPELINE_FLOW</h2>
        <p className="text-sm text-zinc-500 font-mono">
          {mode === 'purist' ? 'INDUSTRIAL_LUXURY_INTERFACE' : 'Simple Progress View'}
        </p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8">
        {/* Flow Diagram */}
        <div className="relative flex items-center justify-between gap-4 mb-8">
          {STAGES.map((stage, idx) => {
            const state = nodeStates[stage] || { status: 'idle' };
            const isActive = packetPosition === idx;

            return (
              <div key={stage} className="flex items-center flex-1">
                {/* Node */}
                <div
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${getStatusColor(
                    state.status
                  )} ${isActive ? 'ring-2 ring-white/50' : ''}`}
                  onClick={() => setSelectedNode(stage)}
                  data-testid={`pipeline-node-${stage}`}
                >
                  <div className="text-xs font-mono font-bold mb-1">
                    {getNodeLabel(stage)}
                  </div>
                  <div className="text-xs text-zinc-400">{state.status.toUpperCase()}</div>

                  {mode === 'purist' && state.startedAt && (
                    <div className="mt-2 pt-2 border-t border-zinc-700 text-xs font-mono text-zinc-500">
                      <div>ID: {stage.substring(0, 8)}</div>
                      <div>TIME: {state.duration ? `${state.duration}ms` : 'N/A'}</div>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                {idx < STAGES.length - 1 && (
                  <div className="flex-1 h-0.5 bg-zinc-700 mx-2 relative">
                    {isActive && (
                      <div className="absolute top-1/2 left-0 w-2 h-2 bg-yellow-500 rounded-full animate-pulse -translate-y-1/2"></div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Stage Drawer */}
        {selectedNode && (
          <div
            className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6"
            data-testid="stage-drawer"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold font-mono">{getNodeLabel(selectedNode)}</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {mode === 'tourist' ? (
              <div className="space-y-2">
                <p className="text-sm text-zinc-300">
                  {nodeStates[selectedNode]?.summary || 'No summary available yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-mono text-zinc-500 mb-1">STATUS</div>
                  <div className="font-mono">{nodeStates[selectedNode]?.status}</div>
                </div>
                <div>
                  <div className="text-xs font-mono text-zinc-500 mb-1">TIMESTAMPS</div>
                  <div className="font-mono text-sm">
                    <div>START: {nodeStates[selectedNode]?.startedAt || 'N/A'}</div>
                    <div>END: {nodeStates[selectedNode]?.endedAt || 'N/A'}</div>
                    <div>DURATION: {nodeStates[selectedNode]?.duration || 'N/A'}ms</div>
                  </div>
                </div>
                {nodeStates[selectedNode]?.artifactPath && (
                  <div>
                    <div className="text-xs font-mono text-zinc-500 mb-1">ARTIFACT</div>
                    <div className="font-mono text-sm text-blue-400">
                      {nodeStates[selectedNode]?.artifactPath}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* JSON Stream Panel (Purist only) */}
        {mode === 'purist' && stageEvents.length > 0 && (
          <div className="mt-8 bg-black/50 border border-zinc-700 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold font-mono">JSON_STREAM</h3>
              <button
                onClick={() => navigator.clipboard.writeText(JSON.stringify(stageEvents, null, 2))}
                data-testid="copy-json-button"
                className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs font-mono"
              >
                COPY JSON
              </button>
            </div>
            <div className="overflow-auto max-h-96 font-mono text-xs">
              <pre className="text-zinc-300">{JSON.stringify(stageEvents, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
