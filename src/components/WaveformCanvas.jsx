import { useEffect, useRef } from 'react';

export default function WaveformCanvas({ analyser, height = 120 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

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

      // center reference line
      ctx.strokeStyle = 'rgba(148,163,184,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      if (analyser) {
        const bufferLength = analyser.fftSize;
        const data = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(data);

        ctx.lineWidth = 2 * dpr;
        ctx.strokeStyle = '#22d3ee';
        ctx.shadowColor = 'rgba(34,211,238,0.6)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        const step = w / bufferLength;
        for (let i = 0; i < bufferLength; i++) {
          const v = data[i] / 128 - 1;
          const y = h / 2 + v * (h / 2) * 0.9;
          const x = i * step;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = 'rgba(148,163,184,0.35)';
        ctx.font = `${13 * dpr}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('No live signal', w / 2, h / 2 - 8 * dpr);
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, height]);

  return <canvas ref={canvasRef} style={{ height }} className="w-full rounded-lg" />;
}
