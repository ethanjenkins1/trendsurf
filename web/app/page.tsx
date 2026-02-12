'use client';

import { useState } from 'react';
import Hero from '@/components/Hero';
import InputForm from '@/components/InputForm';
import PipelineVisualization from '@/components/PipelineVisualization';
import ResultsView from '@/components/ResultsView';
import DeveloperConsole from '@/components/DeveloperConsole';
import ModeToggle from '@/components/ModeToggle';

export default function Home() {
  const [mode, setMode] = useState<'tourist' | 'purist'>('tourist');
  const [isRunning, setIsRunning] = useState(false);
  const [runData, setRunData] = useState<any>(null);
  const [stageEvents, setStageEvents] = useState<any[]>([]);

  const handleGenerate = async (topic: string, brand: string, isDemo: boolean) => {
    setIsRunning(true);
    setRunData(null);
    setStageEvents([]);

    try {
      // Start pipeline
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          brand,
          mode: isDemo ? 'demo' : 'live',
          seed: isDemo ? 1337 : undefined,
          telemetry: true,
        }),
      });

      const result = await response.json();
      const runId = result.runId;

      // Subscribe to SSE for stage events
      const eventSource = new EventSource(`/api/runs/${runId}/events`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'stage_event') {
          setStageEvents((prev) => [...prev, data]);
        } else if (data.type === 'complete') {
          setRunData(data.result);
          eventSource.close();
          setIsRunning(false);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setIsRunning(false);
      };
    } catch (error) {
      console.error('Pipeline error:', error);
      setIsRunning(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Mode Toggle */}
        <div className="flex justify-end mb-4">
          <ModeToggle mode={mode} onChange={setMode} />
        </div>

        {/* Hero Section */}
        <Hero />

        {/* Input Form */}
        <InputForm onGenerate={handleGenerate} isRunning={isRunning} />

        {/* Pipeline Visualization */}
        {(isRunning || stageEvents.length > 0) && (
          <PipelineVisualization
            mode={mode}
            stageEvents={stageEvents}
            isRunning={isRunning}
          />
        )}

        {/* Results View */}
        {runData && <ResultsView mode={mode} data={runData} />}

        {/* Developer Console (Purist only) */}
        {mode === 'purist' && runData && (
          <DeveloperConsole data={runData} stageEvents={stageEvents} />
        )}
      </div>
    </main>
  );
}
