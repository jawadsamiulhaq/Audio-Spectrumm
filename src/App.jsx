import { useAudioEngine } from './hooks/useAudioEngine';
import Header from './components/Header';
import RecorderPanel from './components/RecorderPanel';
import SourcePanel from './components/SourcePanel';
import DspPanel from './components/DspPanel';
import VisualizerPanel from './components/VisualizerPanel';
import PlayerPanel from './components/PlayerPanel';
import InfoPanel from './components/InfoPanel';

export default function App() {
  const engine = useAudioEngine();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Header engine={engine} />

      <main className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <RecorderPanel engine={engine} />
          <SourcePanel engine={engine} />
          <DspPanel engine={engine} />
        </div>
        <div className="flex flex-col gap-5">
          <VisualizerPanel engine={engine} />
          <PlayerPanel engine={engine} />
        </div>
      </main>

      <div className="mt-5">
        <InfoPanel />
      </div>

      <footer className="mt-6 text-center text-[11px] text-slate-600">
        Built with the Web Audio API · All processing happens locally in your browser
      </footer>
    </div>
  );
}
