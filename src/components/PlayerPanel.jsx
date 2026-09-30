import StaticWaveform from './StaticWaveform';
import Tooltip from './Tooltip';

function formatTime(sec) {
  if (!isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlayerPanel({ engine }) {
  const hasAudio = !!engine.activeBuffer;

  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center text-sm font-semibold uppercase tracking-wider text-slate-200">
          Player &amp; Export
          <Tooltip text="Plays the processed buffer (post low-pass + transposition + normalization). Export renders the exact same buffer to a 16-bit PCM WAV file." />
        </h2>
        <span className="font-mono-num text-xs text-slate-500">
          {engine.sampleRate ? `${Math.round(engine.sampleRate)} Hz · ${engine.activeBuffer?.numberOfChannels ?? 1}ch` : '—'}
        </span>
      </div>

      <div className="mb-3">
        <StaticWaveform
          buffer={engine.activeBuffer}
          currentTime={engine.currentTime}
          duration={engine.duration}
          onSeek={engine.seek}
        />
      </div>

      <div className="mb-4 flex items-center justify-between text-xs font-mono-num text-slate-400">
        <span>{formatTime(engine.currentTime)}</span>
        <span>{formatTime(engine.duration)}</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={engine.isPlaying ? engine.pause : engine.play}
          disabled={!hasAudio}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan text-abyss shadow-[0_0_20px_rgba(34,211,238,0.35)] transition hover:bg-cyan-2 disabled:cursor-not-allowed disabled:bg-line disabled:text-slate-600 disabled:shadow-none"
          aria-label={engine.isPlaying ? 'Pause' : 'Play'}
        >
          {engine.isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="1" width="4" height="14" /><rect x="10" y="1" width="4" height="14" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.5v13l11-6.5z" /></svg>
          )}
        </button>

        <button
          onClick={engine.stop}
          disabled={!hasAudio}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-slate-400 transition hover:border-slate-500 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Stop"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect width="12" height="12" rx="1" /></svg>
        </button>

        <button
          onClick={engine.toggleLoop}
          disabled={!hasAudio}
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-40 ${
            engine.isLooping ? 'border-cyan/60 bg-cyan/10 text-cyan' : 'border-line text-slate-400 hover:border-slate-500 hover:text-slate-200'
          }`}
          aria-label="Toggle loop"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        </button>

        <div className="flex-1" />

        <button
          onClick={engine.exportWav}
          disabled={!hasAudio}
          className="rounded-lg border border-cyan/40 px-4 py-2 text-xs font-semibold text-cyan transition hover:bg-cyan/10 disabled:cursor-not-allowed disabled:border-line disabled:text-slate-600"
        >
          Download WAV
        </button>
      </div>
    </div>
  );
}
