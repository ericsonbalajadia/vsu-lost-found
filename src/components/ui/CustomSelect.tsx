// src/components/ui/CustomSelect.tsx
import { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  label?: string;
  required?: boolean;
}

export default function CustomSelect({ id, value, onChange, options, label, required }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find(opt => opt.value === value)?.label || options[0]?.label;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-on-surface-variant mb-2">
          {label} {required && <span className="text-error text-sm font-bold ml-0.5">*</span>}
        </label>
      )}
      <button
        type="button"
        id={id}
        onClick={() => setOpen(!open)}
        className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 pr-10 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all flex justify-between items-center"
      >
        <span className="text-on-surface">{selectedLabel}</span>
        <span className="material-symbols-outlined text-outline transition-transform duration-200">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {open && (
        <ul className="absolute z-20 w-full mt-1 bg-surface-container-lowest rounded-lg shadow-lg border border-outline-variant/20 max-h-60 overflow-auto">
          {options.map(opt => (
            <li
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`px-4 py-2 cursor-pointer hover:bg-primary/10 transition-colors ${
                opt.value === value ? 'bg-primary/10 text-primary font-semibold' : 'text-on-surface'
              }`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}