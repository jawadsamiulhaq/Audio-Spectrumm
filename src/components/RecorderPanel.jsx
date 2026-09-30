import { useState } from 'react';
import Tooltip from './Tooltip';
import Slider from './Slider';
import WaveformCanvas from './WaveformCanvas';

const DURATION_PRESETS = [5, 10, 30, 60];

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function RecorderPanel({ engine }) {
  const [mode, setMode] = useState('scheduled'); // 'scheduled' | 'manual'
  const [durationSec, setDurationSec] = useState(10);
  const [customSec, setCustomSec] = useState('');

  const effectiveDuration = customSec ? Number(customSec) : durationSec;
  const remaining = engine.isScheduled ? Math.max(0, engine.targetSec - engine.elapsedSec) : null;

  const handleStart = () => {
    engine.startRecording({
      scheduled: mode === 'scheduled',
      durationSec: mode === 'scheduled' ? effectiveDuration : undefined,
    });
  };

  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center text-sm font-semibold uppercase tracking-wider text-slate-200">
          Live Recorder
          <Tooltip text="Uses getUserMedia with echo cancellation, noise suppression, and auto-gain control disabled, plus a raw Web Audio ScriptProcessor tap — standard MediaRecorder codecs (Opus/AAC) apply high-pass filtering that can destroy sub-20Hz content before you ever see it." />
        </h2>
        {engine.isRecording && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-danger">
            <span className="h-2 w-2 animate-rec rounded-full bg-danger" />
            REC
          </span>
        )}
      </div>

      <div className="mb-4 flex rounded-lg border border-line bg-abyss p-1 text-xs font-medium">
        <button
          className={`flex-1 rounded-md py-1.5 transition ${mode === 'scheduled' ? 'bg-cyan/15 text-cyan' : 'text-slate-400 hover:text-slate-200'}`}
          onClick={() => setMode('scheduled')}
          disabled={engine.isRecording}
        >
          Scheduled Timer
        </button>
        <button
          className={`flex-1 rounded-md py-1.5 transition ${mode === 'manual' ? 'bg-cyan/15 text-cyan' : 'text-slate-400 hover:text-slate-200'}`}
          onClick={() => setMode('manual')}
          disabled={engine.isRecording}
        >
          Manual Start/Stop
        </button>
      </div>

      {mode === 'scheduled' && (
        <div className="mb-4">
          <div className="mb-2 flex gap-2">
            {DURATION_PRESETS.map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDurationSec(d);
                  setCustomSec('');
                }}
                disabled={engine.isRecording}
                className={`flex-1 rounded-md border py-1.5 text-xs font-medium transition ${
                  durationSec === d && !customSec
                    ? 'border-cyan/60 bg-cyan/10 text-cyan'
                    : 'border-line text-slate-400 hover:border-slate-600'
                }`}
              >
                {d < 60 ? `${d}s` : '1m'}
              </button>
            ))}
          </div>
          <input
            type="number"
            min="1"
            max="600"
            placeholder="Custom duration (seconds)"
            value={customSec}
            disabled={engine.isRecording}
            onChange={(e) => setCustomSec(e.target.value)}
            className="w-full rounded-md border border-line bg-abyss px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:border-cyan/50 focus:outline-none"
          />
        </div>
      )}

      <div className="mb-4">
        <Slider
          label="Input Gain"
          value={engine.params.inputGain}
          min={0}
          max={4}
          step={0.05}
          valueLabel={`${engine.params.inputGain.toFixed(2)}x`}
          onChange={(v) => engine.setParam('inputGain', v)}
        />
      </div>

      <div className="mb-4">
        <WaveformCanvas analyser={engine.isRecording ? engine.activeAnalyser : null} height={100} />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={engine.isRecording ? engine.stopRecording : handleStart}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
            engine.isRecording
              ? 'bg-danger/20 text-danger hover:bg-danger/30'
              : 'bg-cyan text-abyss hover:bg-cyan-2 shadow-[0_0_20px_rgba(34,211,238,0.35)]'
          }`}
        >
          {engine.isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        {engine.isRecording && (
          <div className="font-mono-num w-20 text-center text-sm text-slate-300">
            {mode === 'scheduled' ? formatTime(remaining) : formatTime(engine.elapsedSec)}
          </div>
        )}
      </div>
    </div>
  );
}
