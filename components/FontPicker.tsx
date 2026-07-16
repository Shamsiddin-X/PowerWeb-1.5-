import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Type } from 'lucide-react';
import { useSystemFonts } from '../utils/useSystemFonts';

interface FontPickerProps {
  value: string;
  onChange: (font: string) => void;
}

export const FontPicker: React.FC<FontPickerProps> = ({ value, onChange }) => {
  const { fonts, loading } = useSystemFonts();
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [search, setSearch] = useState('');
  const [isDark, setIsDark] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Detect dark mode
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const filteredAll = fonts.filter(f =>
    f.toLowerCase().includes(search.toLowerCase())
  );
  const filtered = filteredAll.slice(0, 30);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(e.target as Node);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(e.target as Node);
      
      if (isOutsideContainer && isOutsideDropdown) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-focus & scroll to selected
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchRef.current?.focus();
        // Scroll to current value
        const el = listRef.current?.querySelector('[data-selected="true"]') as HTMLElement;
        el?.scrollIntoView({ block: 'center' });
      }, 50);
    }
  }, [open]);

  // Colors based on dark mode
  const bg = isDark ? '#1e293b' : '#ffffff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const text = isDark ? '#e2e8f0' : '#1e293b';
  const subtext = isDark ? '#94a3b8' : '#6b7280';
  const hoverBg = isDark ? '#334155' : '#fff7ed';
  const selectedBg = isDark ? '#334155' : '#fff7ed';
  const selectedText = isDark ? '#fb923c' : '#ea580c';
  const inputBg = isDark ? '#1e293b' : '#ffffff';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Button */}
      <button
        onClick={() => {
            if (!open && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDropdownPos({
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: Math.max(180, rect.width)
                });
            }
            setOpen(v => !v);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '4px 8px',
          fontSize: '12px',
          border: `1px solid ${open ? '#ea580c' : border}`,
          borderRadius: '4px',
          background: bg,
          color: text,
          cursor: 'pointer',
          fontFamily: value || 'Inter',
          boxShadow: open ? '0 0 0 2px rgba(234,88,12,0.25)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          outline: 'none',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {value || 'Select Font'}
        </span>
        <ChevronDown size={12} style={{
          marginLeft: '4px',
          flexShrink: 0,
          color: subtext,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s'
        }} />
      </button>

      {/* Dropdown */}
      {open && createPortal(
        <div ref={dropdownRef} style={{
          position: 'absolute',
          zIndex: 9999,
          top: dropdownPos.top,
          left: dropdownPos.left,
          width: dropdownPos.width,
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          overflow: 'hidden',
        }}>
          {/* Search bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 8px',
            borderBottom: `1px solid ${border}`,
            background: inputBg,
          }}>
            <Search size={11} style={{ color: subtext, flexShrink: 0 }} />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search fonts..."
              style={{
                flex: 1,
                fontSize: '11px',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: text,
              }}
              onKeyDown={e => e.stopPropagation()}
            />
            {loading && (
              <span style={{ fontSize: '9px', color: subtext, whiteSpace: 'nowrap' }}>Loading...</span>
            )}
          </div>

          {/* Font List */}
          <div ref={listRef} style={{ overflowY: 'auto', maxHeight: '220px' }}>
            {filtered.length === 0 ? (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                color: subtext,
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Type size={16} style={{ opacity: 0.4 }} />
                No fonts found
              </div>
            ) : (
              filtered.map(font => {
                const isSelected = font === value;
                return (
                  <button
                    key={font}
                    data-selected={isSelected}
                    onMouseDown={e => {
                      e.preventDefault();
                      onChange(font);
                      setOpen(false);
                      setSearch('');
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = hoverBg;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = isSelected ? selectedBg : 'transparent';
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontFamily: font,
                      background: isSelected ? selectedBg : 'transparent',
                      color: isSelected ? selectedText : text,
                      fontWeight: isSelected ? 600 : 400,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                      outline: 'none',
                    }}
                  >
                    {font}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '3px 8px',
            borderTop: `1px solid ${border}`,
            fontSize: '9px',
            color: subtext,
            textAlign: 'right',
            background: inputBg,
          }}>
            Showing {filtered.length} / {filteredAll.length} fonts
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
