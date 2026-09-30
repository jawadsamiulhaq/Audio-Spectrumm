import { useEffect, useRef, useState } from 'react';

const MAX_DISPLAY_HZ = 2000;
const SUBBASS_HZ = 50;

export default function SpectrumCanvas({ analyser, height = 200 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const [peak, setPeak] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const { width } = canvas.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#05070a';
      ctx.fillRect(0, 0, w, h);

      if (analyser) {
        const sampleRate = analyser.context.sampleRate;
        const binHz = sampleRate / analyser.fftSize;
        const binsToShow = Math.min(analyser.frequencyBinCount, Math.ceil(MAX_DISPLAY_HZ / binHz));
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);

        // highlight sub-bass 0-50Hz band
        const subBassPx = (SUBBASS_HZ / MAX_DISPLAY_HZ) * w;
        ctx.fillStyle = 'rgba(34,211,238,0.08)';
        ctx.fillRect(0, 0, subBassPx, h);
        ctx.strokeStyle = 'rgba(34,211,238,0.35)';
        ctx.setLineDash([4 * dpr, 4 * dpr]);
        ctx.beginPath();
        ctx.moveTo(subBassPx, 0);
        ctx.lineTo(subBassPx, h);
        ctx.stroke();
        ctx.setLineDash([]);

        const barWidth = w / binsToShow;
        let maxVal = 0;
        let maxIdx = 0;
        for (let i = 0; i < binsToShow; i++) {
          const v = data[i];
          if (v > maxVal) {
            maxVal = v;
            maxIdx = i;
          }
          const magnitude = v / 255;
          const barHeight = magnitude * h;
          const x = i * barWidth;
          const grad = ctx.createLinearGradient(0, h - barHeight, 0, h);
          grad.addColorStop(0, '#67e8f9');
          grad.addColorStop(1, '#0e7490');
          ctx.fillStyle = grad;
          ctx.fillRect(x, h - barHeight, Math.max(1, barWidth - 1), barHeight);
        }

        if (maxVal > 12) {
          const freq = maxIdx * binHz;
          setPeak(freq);
        } else {
          setPeak(null);
        }
      } else {
        setPeak(null);
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
      <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-2 rounded-md bg-black/50 px-2 py-1 text-xs backdrop-blur-sm">
        <span className="text-slate-400">Peak</span>
        <span className="font-mono-num font-semibold text-cyan glow-text">
          {peak !== null ? `${peak.toFixed(2)} Hz` : '—'}
        </span>
      </div>
      <div className="pointer-events-none absolute bottom-1 left-2 text-[10px] text-slate-500">0 Hz</div>
      <div className="pointer-events-none absolute bottom-1 right-2 text-[10px] text-slate-500">{MAX_DISPLAY_HZ} Hz</div>
    </div>
  );
}
