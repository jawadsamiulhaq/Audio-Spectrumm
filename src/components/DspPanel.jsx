import Tooltip from './Tooltip';
import Slider from './Slider';

export default function DspPanel({ engine }) {
  const { params, setParam, isProcessing } = engine;

  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center text-sm font-semibold uppercase tracking-wider text-slate-200">
          DSP Pipeline
          <Tooltip text="Signal flows: Low-pass filter (isolates sub-cutoff content) -> Speed/pitch transposition (playback rate multiplier) -> Gain normalization. Re-renders automatically via an OfflineAudioContext whenever a control changes." />
        </h2>
        {isProcessing && <span className="text-[10px] uppercase tracking-wider text-amber animate-pulse">Rendering…</span>}
      </div>

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <label className="flex items-center text-xs font-medium uppercase tracking-wider text-slate-400">
            Low-Pass Filter
            <Tooltip text="A biquad low-pass filter attenuates everything above the cutoff, isolating the infrasound / sub-bass band (typically below 20 Hz) from higher-frequency noise." />
          </label>
          <button
            onClick={() => setParam('lowpassEnabled', !params.lowpassEnabled)}
            className={`h-5 w-9 rounded-full transition ${params.lowpassEnabled ? 'bg-cyan' : 'bg-line'}`}
          >
            <span
              className={`block h-4 w-4 translate-y-0.5 rounded-full bg-abyss transition-transform ${
                params.lowpassEnabled ? 'translate-x-[18px]' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
        <Slider
          label="Cutoff Frequency"
          value={params.cutoffHz}
          min={5}
          max={100}
          step={1}
          unit=" Hz"
          disabled={!params.lowpassEnabled}
          onChange={(v) => setParam('cutoffHz', v)}
        />
      </div>

      <div className="mb-5">
        <Slider
          label="Speed / Pitch Multiplier"
          value={params.speed}
          min={1}
          max={100}
          step={1}
          valueLabel={`${params.speed}x`}
          tooltip={
            <Tooltip text="Accelerating playback raises pitch proportionally (like speeding up a tape). A 5 Hz signal boosted 50x becomes a 250 Hz tone — audible transposition of infrasound into the human hearing range (~20 Hz-20 kHz)." />
          }
          onChange={(v) => setParam('speed', v)}
        />
        <div className="mt-1 flex justify-between text-[10px] text-slate-600">
          <span>1x (original)</span>
          <span>100x</span>
        </div>
      </div>

      <div className="mb-1">
        <div className="mb-2 flex items-center justify-between">
          <label className="flex items-center text-xs font-medium uppercase tracking-wider text-slate-400">
            Auto-Normalize
            <Tooltip text="Faint low-frequency signals are often extremely quiet. Normalization scans the rendered buffer's peak amplitude and scales it up to a safe target level so transposed tones are clearly audible." />
          </label>
          <button
            onClick={() => setParam('normalize', !params.normalize)}
            className={`h-5 w-9 rounded-full transition ${params.normalize ? 'bg-cyan' : 'bg-line'}`}
          >
            <span
              className={`block h-4 w-4 translate-y-0.5 rounded-full bg-abyss transition-transform ${
                params.normalize ? 'translate-x-[18px]' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
        <Slider
          label="Manual Gain Trim"
          value={params.gainDb}
          min={-24}
          max={24}
          step={0.5}
          unit=" dB"
          onChange={(v) => setParam('gainDb', v)}
        />
      </div>
    </div>
  );
}
