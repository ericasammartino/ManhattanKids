"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type Option = { value: string; label: string };

type Props = {
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  options: Option[];
  selected: string[];
  emptyLabel: string;
  onChange: (next: string[]) => void;
};

export default function MultiSelectMenu({
  label,
  icon,
  iconBg,
  options,
  selected,
  emptyLabel,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const summary =
    selected.length === 0
      ? emptyLabel
      : selected.length === 1
        ? options.find((o) => o.value === selected[0])?.label ?? selected[0]
        : `${selected.length} selected`;

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-2xl border border-white/80 bg-white px-4 py-3.5 text-left shadow-sm transition-shadow hover:shadow-md"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
      >
        <span
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">
            {label}
          </span>
          <span className="block truncate text-sm font-medium text-foreground">
            {summary}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          className="absolute left-0 right-0 z-40 mt-2 max-h-56 overflow-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-lg"
        >
          {options.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted">
              No options for the current filters
            </p>
          ) : (
            options.map((opt) => {
              const checked = selected.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(opt.value)}
                    className="h-4 w-4 rounded border-gray-300 text-[#1D2B4B] focus:ring-[#1D2B4B]"
                  />
                  <span className="min-w-0 flex-1 text-foreground">{opt.label}</span>
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
