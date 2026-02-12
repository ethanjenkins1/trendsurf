'use client';

interface ResultsViewProps {
  mode: 'tourist' | 'purist';
  data: any;
}

export default function ResultsView({ mode, data }: ResultsViewProps) {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAdaptiveCard = () => {
    const json = JSON.stringify(data.adaptiveCard.json, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'adaptive-card.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mb-16" data-testid="results-view">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2 font-mono">OUTPUT_ARTIFACTS</h2>
        <p className="text-sm text-zinc-500 font-mono">Generated social media content</p>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* LinkedIn */}
        <div
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6"
          data-testid="card-linkedin"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="text-2xl">💼</div>
            <h3 className="text-lg font-bold font-mono">LINKEDIN</h3>
          </div>
          <div className="bg-black/30 border border-zinc-700 rounded p-4 mb-4 text-sm text-zinc-300 whitespace-pre-wrap min-h-[200px]">
            {data.outputs?.linkedin?.text || 'No LinkedIn post available'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCopy(data.outputs?.linkedin?.text || '')}
              data-testid="copy-linkedin"
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-2 rounded font-mono text-xs"
            >
              COPY
            </button>
            <button
              onClick={() =>
                handleDownload(data.outputs?.linkedin?.text || '', 'linkedin.md')
              }
              data-testid="download-linkedin"
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-2 rounded font-mono text-xs"
            >
              DOWNLOAD
            </button>
          </div>
        </div>

        {/* X/Twitter */}
        <div
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6"
          data-testid="card-twitter"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="text-2xl">𝕏</div>
            <h3 className="text-lg font-bold font-mono">X/TWITTER</h3>
            {data.outputs?.x?.charCount && (
              <span className="ml-auto text-xs font-mono text-zinc-500" data-testid="twitter-char-count">
                {data.outputs.x.charCount}/280
              </span>
            )}
          </div>
          <div className="bg-black/30 border border-zinc-700 rounded p-4 mb-4 text-sm text-zinc-300 whitespace-pre-wrap min-h-[200px]">
            {data.outputs?.x?.text || 'No X/Twitter post available'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCopy(data.outputs?.x?.text || '')}
              data-testid="copy-twitter"
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-2 rounded font-mono text-xs"
            >
              COPY
            </button>
            <button
              onClick={() => handleDownload(data.outputs?.x?.text || '', 'twitter.md')}
              data-testid="download-twitter"
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-2 rounded font-mono text-xs"
            >
              DOWNLOAD
            </button>
          </div>
        </div>

        {/* Teams */}
        <div
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6"
          data-testid="card-teams"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="text-2xl">📋</div>
            <h3 className="text-lg font-bold font-mono">TEAMS</h3>
          </div>
          <div className="bg-black/30 border border-zinc-700 rounded p-4 mb-4 text-sm text-zinc-300 whitespace-pre-wrap min-h-[200px]">
            {data.outputs?.teams?.text || 'No Teams post available'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCopy(data.outputs?.teams?.text || '')}
              data-testid="copy-teams"
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-2 rounded font-mono text-xs"
            >
              COPY
            </button>
            <button
              onClick={() => handleDownload(data.outputs?.teams?.text || '', 'teams.md')}
              data-testid="download-teams"
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-2 rounded font-mono text-xs"
            >
              DOWNLOAD
            </button>
          </div>
        </div>
      </div>

      {/* Compliance & Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Compliance Checklist */}
        <div
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6"
          data-testid="compliance-section"
        >
          <h3 className="text-lg font-bold font-mono mb-4">COMPLIANCE_CHECKLIST</h3>
          <div className="space-y-2">
            {data.compliance?.checklist?.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex items-start gap-3 text-sm"
                data-testid={`compliance-item-${idx}`}
              >
                <span className="text-lg">
                  {item.status === 'pass' ? '✅' : item.status === 'warn' ? '⚠️' : '❌'}
                </span>
                <div>
                  <div className="font-mono">{item.item}</div>
                  {item.notes && <div className="text-xs text-zinc-500">{item.notes}</div>}
                </div>
              </div>
            ))}
          </div>

          {data.compliance?.disclaimers && data.compliance.disclaimers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-700">
              <div className="text-xs font-mono text-zinc-500 mb-2">REQUIRED_DISCLAIMERS</div>
              {data.compliance.disclaimers.map((disclaimer: string, idx: number) => (
                <div key={idx} className="text-xs text-zinc-400 mb-1">
                  • {disclaimer}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sources */}
        <div
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6"
          data-testid="sources-section"
        >
          <h3 className="text-lg font-bold font-mono mb-4">SOURCE_CITATIONS</h3>
          <div className="space-y-3">
            {data.sources?.map((source: any, idx: number) => (
              <div key={idx} className="text-sm" data-testid={`source-${idx}`}>
                <div className="font-mono text-zinc-300">{source.title}</div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 break-all"
                >
                  {source.url}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Adaptive Card Preview */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6" data-testid="adaptive-card-section">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold font-mono">ADAPTIVE_CARD_PREVIEW</h3>
          <button
            onClick={handleDownloadAdaptiveCard}
            data-testid="download-adaptive-card"
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded font-mono text-xs"
          >
            DOWNLOAD JSON
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="bg-white text-black rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-2xl">🏄</div>
              <div>
                <div className="text-lg font-bold">TrendSurf Copilot</div>
                <div className="text-xs text-gray-600">AI-Powered Social Media Pipeline</div>
              </div>
            </div>
            <div className="text-sm">
              <div className="font-bold mb-2">📌 Topic: {data.topic}</div>
              <div className="bg-green-50 border border-green-200 rounded p-3 text-xs">
                <div className="font-bold mb-2">✅ Compliance Status</div>
                {data.compliance?.checklist?.slice(0, 3).map((item: any, idx: number) => (
                  <div key={idx}>{item.item}: ✓</div>
                ))}
              </div>
            </div>
          </div>

          {/* JSON (Purist only) */}
          {mode === 'purist' && (
            <div className="bg-black/50 border border-zinc-700 rounded p-4 overflow-auto max-h-96">
              <pre className="text-xs font-mono text-zinc-300">
                {JSON.stringify(data.adaptiveCard.json, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
