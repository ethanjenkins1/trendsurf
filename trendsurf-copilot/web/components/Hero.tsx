export default function Hero() {
  return (
    <section className="mb-16 pt-12" data-testid="hero-section">
      <div className="flex items-baseline gap-4 mb-4">
        <h1 className="text-6xl font-bold tracking-tight">
          TRENDSURF <span className="text-zinc-400">COPILOT</span>
        </h1>
        <div className="text-zinc-500 font-mono text-sm">
          v1.0.0
        </div>
      </div>
      
      <p className="text-2xl text-zinc-400 font-light mb-2">
        AI-Powered Social Media Content Pipeline for Fintech
      </p>
      
      <p className="text-sm text-zinc-600 font-mono mb-12">
        Built for Agents League @ TechConnect — Reasoning Agents Track (Microsoft Foundry)
      </p>

      {/* Industrial metadata plaque */}
      <div className="border-l-2 border-zinc-700 pl-6 space-y-1 text-xs font-mono text-zinc-500">
        <div>SYSTEM_ID: TRENDSURF-COPILOT-001</div>
        <div>PIPELINE: RESEARCH → BRAND_GUARD → COPYWRITER → REVIEWER</div>
        <div>STATUS: READY</div>
      </div>
    </section>
  );
}
