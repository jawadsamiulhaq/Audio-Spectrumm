const ITEMS = [
  {
    title: 'What is infrasound?',
    body: 'Sound below the threshold of human hearing (~20 Hz), extending down to about 0.001 Hz. Natural sources include earthquakes, volcanoes, ocean waves, and severe weather; man-made sources include HVAC systems, wind turbines, and heavy machinery.',
  },
  {
    title: 'Microphone hardware constraints',
    body: 'Consumer microphones use capsules and DC-blocking capacitors tuned for the speech/music range and typically roll off steeply below 20-50 Hz. True infrasound capture (below ~5 Hz) generally requires purpose-built sensors (e.g. MEMS barometric or piezoelectric infrasound microphones). Treat mic-recorded low end as illustrative, not metrological.',
  },
  {
    title: 'Frequency transposition',
    body: 'This app accelerates playback (raising the AudioBufferSourceNode\'s playbackRate) to shift inaudible low frequencies upward, the same way speeding up a tape recording raises its pitch. A 1x change in speed produces an equal multiplicative change in every frequency component.',
  },
  {
    title: 'FFT resolution limits',
    body: 'A Web Audio AnalyserNode\'s bin width is sampleRate / fftSize. Even at the maximum fftSize (32768) and 48 kHz, each bin spans ~1.5 Hz — coarse relative to the 1-19 Hz band this app targets. Longer FFTs give better resolution but slower time response; this is a fundamental trade-off, not a bug.',
  },
];

export default function InfoPanel() {
  return (
    <div className="panel p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-200">Reference &amp; Limits</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {ITEMS.map((item) => (
          <div key={item.title} className="rounded-lg border border-line bg-abyss/60 p-3">
            <div className="mb-1 text-xs font-semibold text-cyan">{item.title}</div>
            <p className="text-xs leading-relaxed text-slate-400">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
