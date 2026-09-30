import { useState } from 'react';

export default function Tooltip({ text, children }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      {children}
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-cyan/40 text-[10px] leading-none text-cyan/80 hover:bg-cyan/10 hover:text-cyan"
        aria-label="More info"
      >
        i
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg border border-line bg-panel-2 p-3 text-left text-xs font-normal leading-relaxed text-slate-300 shadow-xl">
          {text}
          <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-line bg-panel-2" />
        </span>
      )}
    </span>
  );
}
