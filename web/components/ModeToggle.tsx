interface ModeToggleProps {
  mode: 'tourist' | 'purist';
  onChange: (mode: 'tourist' | 'purist') => void;
}

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div
      className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700 p-1 rounded-lg"
      data-testid="mode-toggle"
    >
      <button
        onClick={() => onChange('tourist')}
        data-testid="mode-toggle-tourist"
        className={`px-4 py-2 rounded-md text-sm font-mono transition-all ${
          mode === 'tourist'
            ? 'bg-zinc-100 text-zinc-900'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        TOURIST
      </button>
      <button
        onClick={() => onChange('purist')}
        data-testid="mode-toggle-purist"
        className={`px-4 py-2 rounded-md text-sm font-mono transition-all ${
          mode === 'purist'
            ? 'bg-zinc-100 text-zinc-900'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        PURIST
      </button>
    </div>
  );
}
