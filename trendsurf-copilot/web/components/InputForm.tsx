'use client';

import { useState, useCallback } from 'react';

interface InputFormProps {
  onGenerate: (topic: string, brand: string, isDemo: boolean) => void;
  isRunning: boolean;
}

const TOPIC_CHIPS = [
  'GitHub Copilot agent mode',
  'AI safety & NIST updates',
  'Kubernetes & cloud-native trends',
  'Open source supply chain security',
];

type WorkIQStatus = 'idle' | 'loading' | 'loaded' | 'error';

/** Brand presets targeting Microsoft & GitHub advocates. */
const BRAND_PRESETS = [
  {
    id: 'github-engineering',
    name: 'GitHub Engineering',
    description: 'Open-source, developer-first, innersource culture',
    icon: '🐙',
    voice: 'Technical, community-driven, transparent',
    audience: 'Developers, OSS maintainers, DevOps engineers',
  },
  {
    id: 'microsoft-ai',
    name: 'Microsoft AI',
    description: 'Responsible AI, Azure AI services, Copilot ecosystem',
    icon: '🤖',
    voice: 'Authoritative, inclusive, innovation-forward',
    audience: 'AI/ML engineers, enterprise architects, CTOs',
  },
  {
    id: 'azure-devops',
    name: 'Azure DevOps',
    description: 'CI/CD pipelines, cloud-native, platform engineering',
    icon: '☁️',
    voice: 'Practical, solution-oriented, engineering excellence',
    audience: 'Platform engineers, SREs, cloud architects',
  },
  {
    id: 'github-security',
    name: 'GitHub Advanced Security',
    description: 'Supply-chain security, GHAS, Dependabot, code scanning',
    icon: '🔒',
    voice: 'Urgent but empowering, shift-left security mindset',
    audience: 'AppSec teams, security champions, CISOs',
  },
  {
    id: 'microsoft-dev-div',
    name: 'Microsoft Developer Division',
    description: 'VS Code, .NET, TypeScript, developer productivity',
    icon: '💻',
    voice: 'Friendly, pragmatic, code-first mentality',
    audience: 'Full-stack developers, tech leads, ISVs',
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    description: 'AI pair programming, agent mode, coding productivity',
    icon: '✨',
    voice: 'Inspiring, evidence-based, developer empowerment',
    audience: 'Software engineers, engineering managers, startups',
  },
  {
    id: 'azure-security',
    name: 'Microsoft Security',
    description: 'Zero Trust, Defender, Sentinel, compliance at scale',
    icon: '🛡️',
    voice: 'Authoritative, risk-aware, solution-oriented',
    audience: 'CISOs, SOC analysts, compliance officers',
  },
  {
    id: 'github-universe',
    name: 'GitHub Community & Advocacy',
    description: 'Developer advocacy, GitHub Universe, campus programs',
    icon: '🌍',
    voice: 'Inclusive, celebratory, community-first',
    audience: 'Student developers, MVPs, community leaders',
  },
  {
    id: 'microsoft-sustainability',
    name: 'Microsoft Sustainability',
    description: 'Green software, carbon-aware computing, ESG reporting',
    icon: '🌱',
    voice: 'Mission-driven, data-backed, forward-looking',
    audience: 'ESG leads, sustainability engineers, policy makers',
  },
  {
    id: 'finguard-capital',
    name: 'FinGuard Capital (Demo)',
    description: 'AI-driven risk management & fintech advisory — sample vertical',
    icon: '🏦',
    voice: 'Professional, authoritative, compliance-first',
    audience: 'CFOs, risk managers, wealth advisors',
  },
];

export default function InputForm({ onGenerate, isRunning }: InputFormProps) {
  const [topic, setTopic] = useState('');
  const [selectedBrand, setSelectedBrand] = useState(BRAND_PRESETS[0]);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);

  // WorkIQ state
  const [workiqStatus, setWorkiqStatus] = useState<WorkIQStatus>('idle');
  const [workiqSuggestions, setWorkiqSuggestions] = useState<string[]>([]);
  const [workiqError, setWorkiqError] = useState<string | null>(null);

  const handleRunDemo = () => {
    onGenerate('AI safety & NIST updates', selectedBrand.name, true);
  };

  const handleTryIt = () => {
    if (topic.trim()) {
      onGenerate(topic, selectedBrand.name, false);
    }
  };

  const handleChipClick = (chipTopic: string) => {
    setTopic(chipTopic);
  };

  const handleBrandSelect = (preset: typeof BRAND_PRESETS[number]) => {
    setSelectedBrand(preset);
    setBrandDropdownOpen(false);
  };

  const fetchWorkIQSuggestions = useCallback(async () => {
    setWorkiqStatus('loading');
    setWorkiqError(null);
    setWorkiqSuggestions([]);
    try {
      const res = await fetch('/api/workiq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.suggestions && data.suggestions.length > 0) {
        setWorkiqSuggestions(data.suggestions);
        setWorkiqStatus('loaded');
      } else {
        setWorkiqError('No suggestions returned');
        setWorkiqStatus('error');
      }
    } catch (err: any) {
      setWorkiqError(err.message || 'Failed to connect to WorkIQ');
      setWorkiqStatus('error');
    }
  }, []);

  return (
    <section className="mb-16" data-testid="input-form">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Run Demo */}
          <div className="border border-zinc-700 rounded-lg p-6 bg-zinc-800/30">
            <h3 className="text-xl font-bold mb-2 font-mono">RUN DEMO</h3>
            <p className="text-sm text-zinc-400 mb-4">
              One-click deterministic demo with fixed seed
            </p>
            <button
              onClick={handleRunDemo}
              disabled={isRunning}
              data-testid="button-run-demo"
              className="w-full bg-zinc-100 text-zinc-900 font-bold py-3 px-6 rounded-md hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'RUNNING...' : 'RUN DEMO'}
            </button>
          </div>

          {/* Try It */}
          <div className="border border-zinc-700 rounded-lg p-6 bg-zinc-800/30">
            <h3 className="text-xl font-bold mb-2 font-mono">TRY IT</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Enter your own topic and brand
            </p>
            <button
              onClick={handleTryIt}
              disabled={isRunning || !topic.trim()}
              data-testid="button-try-it"
              className="w-full bg-zinc-700 text-zinc-100 font-bold py-3 px-6 rounded-md hover:bg-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'RUNNING...' : 'TRY IT'}
            </button>
          </div>
        </div>

        {/* Topic Input */}
        <div className="mb-4">
          <label className="block text-sm font-mono text-zinc-400 mb-2">
            TOPIC_INPUT
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic for social media content..."
            disabled={isRunning}
            data-testid="input-topic"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 disabled:opacity-50"
          />
        </div>

        {/* Topic Chips */}
        <div className="mb-4">
          <label className="block text-sm font-mono text-zinc-400 mb-2">
            SUGGESTED_TOPICS
          </label>
          <div className="flex flex-wrap gap-2">
            {TOPIC_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleChipClick(chip)}
                disabled={isRunning}
                data-testid={`topic-chip-${idx}`}
                className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600 transition-colors disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* WorkIQ — Suggest from My Work */}
        <div className="mb-4">
          <label className="block text-sm font-mono text-zinc-400 mb-2">
            MY_WORK_CONTEXT
            <span className="ml-2 text-xs font-sans text-zinc-500">powered by Microsoft WorkIQ</span>
          </label>

          {workiqStatus === 'idle' && (
            <button
              onClick={fetchWorkIQSuggestions}
              disabled={isRunning}
              data-testid="workiq-suggest-btn"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/40 rounded-md text-sm text-blue-300 hover:from-blue-600/30 hover:to-purple-600/30 hover:border-blue-400/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Suggest from My Work
              <span className="text-xs text-zinc-500 ml-1">(M365 meetings, emails, Teams)</span>
            </button>
          )}

          {workiqStatus === 'loading' && (
            <div className="flex items-center gap-3 px-4 py-3 bg-zinc-800/60 border border-zinc-700 rounded-md" data-testid="workiq-loading">
              <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
              <span className="text-sm text-zinc-300">Querying your Microsoft 365 data via WorkIQ...</span>
            </div>
          )}

          {workiqStatus === 'loaded' && workiqSuggestions.length > 0 && (
            <div data-testid="workiq-suggestions">
              <div className="flex flex-wrap gap-2">
                {workiqSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipClick(suggestion)}
                    disabled={isRunning}
                    data-testid={`workiq-chip-${idx}`}
                    className="px-4 py-2 bg-blue-900/30 border border-blue-500/30 rounded-md text-sm text-blue-200 hover:bg-blue-800/40 hover:border-blue-400/50 transition-colors disabled:opacity-50"
                  >
                    <span className="mr-1.5">⚡</span>
                    {suggestion}
                  </button>
                ))}
              </div>
              <button
                onClick={fetchWorkIQSuggestions}
                disabled={isRunning}
                data-testid="workiq-refresh-btn"
                className="mt-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
              >
                ↻ Refresh suggestions
              </button>
            </div>
          )}

          {workiqStatus === 'error' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-500/30 rounded-md" data-testid="workiq-error">
              <span className="text-sm text-red-300">WorkIQ: {workiqError}</span>
              <button
                onClick={fetchWorkIQSuggestions}
                className="text-xs text-red-400 hover:text-red-200 underline ml-2"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Brand Selector */}
        <div className="relative">
          <label className="block text-sm font-mono text-zinc-400 mb-2">
            BRAND_SELECTOR
          </label>
          <button
            onClick={() => !isRunning && setBrandDropdownOpen(!brandDropdownOpen)}
            disabled={isRunning}
            data-testid="brand-selector"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-4 py-3 text-left hover:border-zinc-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{selectedBrand.icon}</span>
                <div>
                  <span className="text-white font-mono font-bold">{selectedBrand.name}</span>
                  <span className="text-zinc-500 text-sm ml-3">{selectedBrand.description}</span>
                </div>
              </div>
              <svg
                className={`w-4 h-4 text-zinc-400 transition-transform ${brandDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Dropdown */}
          {brandDropdownOpen && (
            <div
              data-testid="brand-dropdown"
              className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-md shadow-2xl max-h-80 overflow-y-auto"
            >
              {BRAND_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleBrandSelect(preset)}
                  data-testid={`brand-option-${preset.id}`}
                  className={`w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-b-0 ${
                    selectedBrand.id === preset.id ? 'bg-zinc-800/80 border-l-2 border-l-white' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl flex-shrink-0">{preset.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono font-bold text-sm">{preset.name}</span>
                        {selectedBrand.id === preset.id && (
                          <span className="text-xs bg-white text-zinc-900 px-1.5 py-0.5 rounded font-bold">ACTIVE</span>
                        )}
                      </div>
                      <p className="text-zinc-400 text-xs mt-0.5">{preset.description}</p>
                      <div className="flex gap-4 mt-1">
                        <span className="text-zinc-500 text-xs">
                          <span className="text-zinc-600">Voice:</span> {preset.voice}
                        </span>
                      </div>
                      <span className="text-zinc-500 text-xs">
                        <span className="text-zinc-600">Audience:</span> {preset.audience}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleTryIt}
          disabled={isRunning || !topic.trim()}
          data-testid="button-generate"
          className="w-full mt-6 bg-white text-zinc-900 font-bold py-4 px-6 rounded-md hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          {isRunning ? '⏳ GENERATING...' : '🚀 GENERATE'}
        </button>
      </div>
    </section>
  );
}
