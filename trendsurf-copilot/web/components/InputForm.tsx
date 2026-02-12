'use client';

import { useState } from 'react';

interface InputFormProps {
  onGenerate: (topic: string, brand: string, isDemo: boolean) => void;
  isRunning: boolean;
}

const TOPIC_CHIPS = [
  'AI safety & NIST updates',
  'Fintech fraud trends',
  'Zero trust for financial services',
  'Agentic DevOps for regulated industries',
];

export default function InputForm({ onGenerate, isRunning }: InputFormProps) {
  const [topic, setTopic] = useState('');
  const [brand] = useState('FinGuard Capital');

  const handleRunDemo = () => {
    onGenerate('AI safety & NIST updates', brand, true);
  };

  const handleTryIt = () => {
    if (topic.trim()) {
      onGenerate(topic, brand, false);
    }
  };

  const handleChipClick = (chipTopic: string) => {
    setTopic(chipTopic);
  };

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

        {/* Brand Selector */}
        <div>
          <label className="block text-sm font-mono text-zinc-400 mb-2">
            BRAND_SELECTOR
          </label>
          <div className="bg-zinc-800 border border-zinc-700 rounded-md px-4 py-3">
            <span className="text-white font-mono">{brand}</span>
          </div>
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
