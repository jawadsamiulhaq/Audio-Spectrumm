export default function Slider({ label, value, min, max, step = 1, onChange, unit = '', disabled, valueLabel, tooltip }) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={disabled ? 'opacity-40' : ''}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {label}
          {tooltip}
        </span>
        <span className="font-mono-num text-xs text-cyan">
          {valueLabel ?? `${value}${unit}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ '--fill': `${pct}%` }}
        className="w-full disabled:cursor-not-allowed"
      />
    </div>
  );
}
