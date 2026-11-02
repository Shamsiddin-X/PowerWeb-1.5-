import React from 'react';

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  'aria-label': string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

/** Native range behavior with the filled track and vertical handle from the visual reference. */
export const Slider: React.FC<SliderProps> = ({
  value, min = 0, max = 100, step = 1, onChange, className = '', disabled = false, id,
  'aria-label': label,
}) => {
  const safeValue = Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
  const progress = max > min ? ((safeValue - min) / (max - min)) * 100 : 0;
  return (
    <div className={`editor-slider ${className}`} data-disabled={disabled || undefined}
      style={{ '--slider-progress': `${progress}%` } as React.CSSProperties}>
      <div className="editor-slider-track" aria-hidden="true" />
      <input id={id} type="range" className="editor-slider-input" value={safeValue}
        min={min} max={max} step={step} onChange={onChange} disabled={disabled} aria-label={label} />
    </div>
  );
};
