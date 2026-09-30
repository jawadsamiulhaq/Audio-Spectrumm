import { useEffect, useRef } from 'react';

const BAND_HZ = 50; // sub-bass focus band, 0-50 Hz

function heatColor(t) {
  // t in [0,1]: deep navy -> cyan -> warm white
  t = Math.max(0, Math.min(1, t));
  if (t < 0.5) {
    const k = t / 0.5;
    return [Math.round(5 + k * (34 - 5)), Math.round(8 + k * (211 - 8)), Math.round(14 + k * (238 - 14))];
  }
  const k = (t - 0.5) / 0.5;
  return [Math.round(34 + k * (255 - 34)), Math.round(211 + k * (255 - 211)), Math.round(238 + k * (255 - 238) * 0.85 + 238 * 0.15)];
}

export default function SpectrogramCanvas({ analyser, height = 220 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const { width } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      if (analyser) {
        const sampleRate = analyser.context.sampleRate;
        const binHz = sampleRate / analyser.fftSize;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);

        ctx.drawImage(canvas, -1, 0, w - 1, h, 0, 0, w - 1, h);

        const column = ctx.createImageData(1, h);
        for (let y = 0; y < h; y++) {
          const freq = BAND_HZ * (1 - y / h);
          const binIdx = Math.min(data.length - 1, Math.round(freq / binHz));
          const magnitude = data[binIdx] / 255;
          const [r, g, b] = heatColor(magnitude);
          const idx = y * 4;
          column.data[idx] = r;
          column.data[idx + 1] = g;
          column.data[idx + 2] = b;
          column.data[idx + 3] = 255;
        }
        ctx.putImageData(column, w - 1, 0);
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, height]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} style={{ height }} className="w-full rounded-lg" />
      <div className="pointer-events-none absolute right-2 top-1 text-[10px] text-slate-500">{BAND_HZ} Hz</div>
      <div className="pointer-events-none absolute bottom-1 right-2 text-[10px] text-slate-500">0 Hz</div>
      {!analyser && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-500">
          Waiting for signal…
        </div>
      )}
    </div>
  );
}
