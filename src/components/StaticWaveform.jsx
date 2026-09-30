import { useEffect, useMemo, useRef } from 'react';

const PEAK_COLUMNS = 1000;

function computePeaks(buffer) {
  if (!buffer) return null;
  const data = buffer.getChannelData(0);
  const blockSize = Math.max(1, Math.floor(data.length / PEAK_COLUMNS));
  const peaks = new Float32Array(PEAK_COLUMNS * 2);
  for (let i = 0; i < PEAK_COLUMNS; i++) {
    const start = i * blockSize;
    let min = 0;
    let max = 0;
    for (let j = 0; j < blockSize && start + j < data.length; j++) {
      const v = data[start + j];
      if (v > max) max = v;
      if (v < min) min = v;
    }
    peaks[i * 2] = min;
    peaks[i * 2 + 1] = max;
  }
  return peaks;
}

export default function StaticWaveform({ buffer, currentTime, duration, onSeek, height = 90 }) {
  const canvasRef = useRef(null);
  const peaks = useMemo(() => computePeaks(buffer), [buffer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const { width } = canvas.getBoundingClientRect();
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#0b0f16';
    ctx.fillRect(0, 0, w, h);

    if (peaks) {
      const colWidth = w / PEAK_COLUMNS;
      ctx.fillStyle = '#38bdf8';
      for (let i = 0; i < PEAK_COLUMNS; i++) {
        const min = peaks[i * 2];
        const max = peaks[i * 2 + 1];
        const y1 = h / 2 - max * (h / 2) * 0.95;
        const y2 = h / 2 - min * (h / 2) * 0.95;
        ctx.fillRect(i * colWidth, y1, Math.max(1, colWidth - 0.5), Math.max(1, y2 - y1));
      }
    } else {
      ctx.fillStyle = 'rgba(148,163,184,0.35)';
      ctx.font = `${13 * dpr}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('No audio loaded', w / 2, h / 2);
    }

    if (duration > 0) {
      const playheadX = (currentTime / duration) * w;
      ctx.fillStyle = 'rgba(34,211,238,0.15)';
      ctx.fillRect(0, 0, playheadX, h);
      ctx.strokeStyle = '#e6fbff';
      ctx.shadowColor = 'rgba(34,211,238,0.8)';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, h);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, [peaks, currentTime, duration, height]);

  const handleClick = (e) => {
    if (!onSeek || !duration) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ height }}
      onClick={handleClick}
      className="w-full cursor-pointer rounded-lg"
    />
  );
}
