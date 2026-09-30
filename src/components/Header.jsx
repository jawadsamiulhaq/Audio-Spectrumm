export default function Header({ engine }) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
      <div>
        <h1 className="glow-text text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">
          INFRASOUND<span className="text-cyan">//</span>LAB
        </h1>
        <p className="mt-1 text-xs text-slate-500">Low-frequency audio capture, transposition &amp; visualization · 1–20 Hz focus</p>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-xs">
        <span className={`h-2 w-2 rounded-full ${engine.activeBuffer ? 'bg-cyan shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-slate-600'}`} />
        <span className="text-slate-400">
          {engine.isRecording
            ? 'Recording'
            : engine.isProcessing
              ? 'Processing'
              : engine.activeBuffer
                ? 'Signal ready'
                : 'Idle'}
        </span>
      </div>
    </header>
  );
}
