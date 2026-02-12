'use client';

import { useState } from 'react';

interface DeveloperConsoleProps {
  data: any;
  stageEvents: any[];
}

export default function DeveloperConsole({ data, stageEvents }: DeveloperConsoleProps) {
  const [activeTab, setActiveTab] = useState<'envelope' | 'events' | 'artifacts' | 'citations' | 'compliance'>('envelope');

  return (
    <section className="mb-16" data-testid="developer-console">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2 font-mono">DEVELOPER_CONSOLE</h2>
        <p className="text-sm text-zinc-500 font-mono">Deep technical inspection (Purist mode only)</p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-zinc-800" data-testid="console-tabs">
          {[
            { id: 'envelope', label: 'RUN_ENVELOPE' },
            { id: 'events', label: 'STAGE_EVENTS' },
            { id: 'artifacts', label: 'ARTIFACTS' },
            { id: 'citations', label: 'CITATIONS' },
            { id: 'compliance', label: 'COMPLIANCE' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              data-testid={`console-tab-${tab.id}`}
              className={`px-6 py-3 font-mono text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-zinc-800 text-white border-b-2 border-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'envelope' && (
            <div data-testid="tab-content-envelope">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-mono text-sm text-zinc-400">Final response JSON</h3>
                <button
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
                  className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs font-mono"
                >
                  COPY JSON
                </button>
              </div>
              <div className="bg-black/50 border border-zinc-700 rounded p-4 overflow-auto max-h-[600px]">
                <pre className="text-xs font-mono text-zinc-300">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div data-testid="tab-content-events">
              <h3 className="font-mono text-sm text-zinc-400 mb-4">Timeline of stage envelopes</h3>
              <div className="space-y-4">
                {stageEvents.map((event, idx) => (
                  <div key={idx} className="bg-zinc-800/50 border border-zinc-700 rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-mono text-sm font-bold">{event.stage?.toUpperCase()}</span>
                        <span
                          className={`ml-3 text-xs px-2 py-1 rounded ${
                            event.status === 'success'
                              ? 'bg-green-500/20 text-green-400'
                              : event.status === 'warning'
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-zinc-700 text-zinc-400'
                          }`}
                        >
                          {event.status?.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-zinc-500">
                        {event.timestamps?.startedAt}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-400">{event.summary}</div>
                    {event.timestamps && (
                      <div className="mt-2 text-xs font-mono text-zinc-600">
                        Duration: {event.timestamps.duration || 'N/A'}ms
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'artifacts' && (
            <div data-testid="tab-content-artifacts">
              <h3 className="font-mono text-sm text-zinc-400 mb-4">Output file paths</h3>
              <div className="space-y-2">
                {Object.entries(data.artifacts || {}).map(([key, path]) => (
                  <div key={key} className="flex items-center gap-3 text-sm">
                    <span className="font-mono text-zinc-500">{key}:</span>
                    <span className="font-mono text-blue-400">{path as string}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'citations' && (
            <div data-testid="tab-content-citations">
              <h3 className="font-mono text-sm text-zinc-400 mb-4">
                Source citations and usage mapping
              </h3>
              <div className="space-y-4">
                {data.sources?.map((source: any, idx: number) => (
                  <div key={idx} className="bg-zinc-800/50 border border-zinc-700 rounded p-4">
                    <div className="font-mono text-sm mb-2">{source.title}</div>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 break-all"
                    >
                      {source.url}
                    </a>
                    <div className="mt-2 text-xs text-zinc-500">
                      Used in: Research stage
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div data-testid="tab-content-compliance">
              <h3 className="font-mono text-sm text-zinc-400 mb-4">
                Compliance checklist with deltas and reasons
              </h3>
              <div className="space-y-3">
                {data.compliance?.checklist?.map((item: any, idx: number) => (
                  <div key={idx} className="bg-zinc-800/50 border border-zinc-700 rounded p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">
                        {item.status === 'pass' ? '✅' : item.status === 'warn' ? '⚠️' : '❌'}
                      </span>
                      <div className="flex-1">
                        <div className="font-mono text-sm mb-1">{item.item}</div>
                        {item.notes && (
                          <div className="text-xs text-zinc-400 mt-1">{item.notes}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {data.compliance?.disclaimers && data.compliance.disclaimers.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-zinc-700">
                    <div className="font-mono text-sm text-zinc-400 mb-3">REQUIRED_DISCLAIMERS</div>
                    {data.compliance.disclaimers.map((disclaimer: string, idx: number) => (
                      <div key={idx} className="bg-zinc-800/30 rounded p-3 mb-2 text-xs text-zinc-300">
                        {disclaimer}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
