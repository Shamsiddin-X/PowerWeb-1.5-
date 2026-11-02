import React, { useId } from 'react';
interface Props { className?: string; }
const star = (cx: number, cy: number) => Array.from({ length: 10 }, (_, i) => {
  const angle = -Math.PI / 2 + i * Math.PI / 5;
  const radius = i % 2 ? 1.3 : 3.2;
  return `${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`;
}).join(' ');

export const FlagTJ: React.FC<Props> = ({ className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 70" className={`country-flag ${className}`} aria-hidden="true" focusable="false">
    <path fill="#fff" d="M0 0h140v70H0z" />
    <path fill="#cc0000" d="M0 0h140v20H0z" />
    <path fill="#006600" d="M0 50h140v20H0z" />
    <g fill="#f8c300">
      {[[-16, -1], [-12, -7], [-6.5, -11], [0, -12.5], [6.5, -11], [12, -7], [16, -1]].map(([x, y], i) =>
        <polygon key={i} points={star(70 + x, 38 + y)} />)}
      <path d="M60 39c2 0 3-2 3-4 2 0 4 2 4 4 0-4 1-7 3-8 2 1 3 4 3 8 0-2 2-4 4-4 0 2 1 4 3 4l-3 5H63z" />
      <path d="M63 45h14v1.6H63z" />
      <circle cx="70" cy="30" r="1.5" />
    </g>
  </svg>
);

export const FlagRU: React.FC<Props> = ({ className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 60" className={`country-flag ${className}`} aria-hidden="true" focusable="false">
    <path fill="#fff" d="M0 0h90v60H0z" />
    <path fill="#0039a6" d="M0 20h90v20H0z" />
    <path fill="#d52b1e" d="M0 40h90v20H0z" />
  </svg>
);

export const FlagUK: React.FC<Props> = ({ className = '' }) => {
  const id = `union-jack-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" className={`country-flag ${className}`} aria-hidden="true" focusable="false">
      <defs><clipPath id={id}><path d="M30 15H60V30Z M30 15V30H0Z M30 15H0V0Z M30 15V0H60Z" /></clipPath></defs>
      <path fill="#012169" d="M0 0h60v30H0z" />
      <path stroke="#fff" strokeWidth="6" d="m0 0 60 30m0-30L0 30" />
      <path stroke="#c8102e" strokeWidth="4" clipPath={`url(#${id})`} d="m0 0 60 30m0-30L0 30" />
      <path stroke="#fff" strokeWidth="10" d="M30 0v30M0 15h60" />
      <path stroke="#c8102e" strokeWidth="6" d="M30 0v30M0 15h60" />
    </svg>
  );
};
