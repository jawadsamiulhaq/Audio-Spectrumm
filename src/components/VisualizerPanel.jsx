import Tooltip from './Tooltip';
import SpectrumCanvas from './SpectrumCanvas';
import SpectrogramCanvas from './SpectrogramCanvas';

export default function VisualizerPanel({ engine }) {
  return (
    <div className="panel p-5">
      <h2 className="mb-4 flex items-center text-sm font-semibold uppercase tracking-wider text-slate-200">
        Visual Analytics Dashboard
        <Tooltip text="Live during recording, or during playback of the processed signal. An AnalyserNode's frequency resolution equals sampleRate / fftSize — at 48 kHz with a 32768-point FFT that's ~1.5 Hz per bin, near the practical limit for resolving raw infrasound detail." />
      </h2>

      <div className="mb-5">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">FFT Spectrum Analyzer</div>
        <SpectrumCanvas analyser={engine.activeAnalyser} />
      </div>

      <div>
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
          Spectrogram — Sub-Bass Band (0–50 Hz)
        </div>
        <SpectrogramCanvas analyser={engine.activeAnalyser} />
      </div>
    </div>
  );
}
