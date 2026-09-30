import { useRef, useState } from 'react';
import Tooltip from './Tooltip';
import { generateToneBuffer, PRESET_TONES } from '../utils/synth';

export default function SourcePanel({ engine }) {
  const fileInputRef = useRef(null);
  const [customHz, setCustomHz] = useState(9);
  const [presetDuration, setPresetDuration] = useState(10);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) engine.loadFile(file);
    e.target.value = '';
  };

  const handlePreset = (hz) => {
    const buffer = generateToneBuffer({ frequencyHz: hz, durationSec: presetDuration, sampleRate: 48000 });
    engine.loadPreset(buffer, `Synthetic ${hz} Hz tone (${presetDuration}s)`);
  };

  return (
    <div className="panel p-5">
      <h2 className="mb-4 flex items-center text-sm font-semibold uppercase tracking-wider text-slate-200">
        Upload &amp; Signal Generator
        <Tooltip text="No infrasound sensor? Generate a pure sine wave at any 1-19 Hz frequency to test the low-pass, transposition, and visualization pipeline end-to-end." />
      </h2>

      <div className="mb-5">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-lg border border-dashed border-line py-4 text-xs text-slate-400 transition hover:border-cyan/50 hover:text-cyan"
        >
          Click to upload WAV / MP3 file
        </button>
        <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
      </div>

      <div className="mb-3 h-px bg-line" />

      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Preset tones</span>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span>Duration</span>
          <input
            type="number"
            min="1"
            max="60"
            value={presetDuration}
            onChange={(e) => setPresetDuration(Number(e.target.value) || 10)}
            className="w-12 rounded border border-line bg-abyss px-1 py-0.5 text-center text-slate-200 focus:border-cyan/50 focus:outline-none"
          />
          <span>s</span>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-4 gap-2">
        {PRESET_TONES.map((p) => (
          <button
            key={p.frequencyHz}
            onClick={() => handlePreset(p.frequencyHz)}
            className="rounded-md border border-line py-2 text-xs font-medium text-slate-300 transition hover:border-cyan/50 hover:bg-cyan/10 hover:text-cyan"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          max="19"
          step="0.5"
          value={customHz}
          onChange={(e) => setCustomHz(Number(e.target.value))}
          className="w-20 rounded-md border border-line bg-abyss px-2 py-1.5 text-xs text-slate-200 focus:border-cyan/50 focus:outline-none"
        />
        <span className="text-xs text-slate-500">Hz</span>
        <button
          onClick={() => handlePreset(customHz)}
          className="flex-1 rounded-md bg-neon/10 py-1.5 text-xs font-medium text-neon transition hover:bg-neon/20"
        >
          Generate custom tone
        </button>
      </div>

      {engine.sourceLabel && (
        <div className="mt-4 truncate rounded-md border border-line bg-abyss px-3 py-2 text-xs text-slate-400">
          Active source: <span className="text-cyan">{engine.sourceLabel}</span>
        </div>
      )}
      {engine.error && (
        <div className="mt-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {engine.error}
        </div>
      )}
    </div>
  );
}
