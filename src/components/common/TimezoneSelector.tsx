'use client';

import React, { useState, useEffect, useRef, useMemo, useId } from 'react';
import { 
  Clock, 
  ChevronDown, 
  Search, 
  Check, 
  MapPin, 
  X,
  Sparkles
} from 'lucide-react';
import { 
  getAllTimezones, 
  searchTimezones, 
  groupTimezonesByRegion, 
  getTimezoneInfo, 
  getBrowserTimezone, 
  normalizeIanaTimezone,
  TimezoneItem 
} from '@/lib/timezones';

interface TimezoneSelectorProps {
  value: string;
  onChange: (iana: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export default function TimezoneSelector({
  value,
  onChange,
  disabled = false,
  className = '',
  id
}: TimezoneSelectorProps) {
  const generatedId = useId();
  const inputId = id || `tz-selector-${generatedId}`;
  const listboxId = `tz-listbox-${generatedId}`;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [browserTz, setBrowserTz] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Detect browser timezone on mount
  useEffect(() => {
    const detected = getBrowserTimezone();
    setBrowserTz(detected);
  }, []);

  // Canonical active timezone info
  const canonicalValue = useMemo(() => normalizeIanaTimezone(value), [value]);
  const activeInfo = useMemo(() => getTimezoneInfo(canonicalValue), [canonicalValue]);
  const browserTzInfo = useMemo(() => browserTz ? getTimezoneInfo(browserTz) : null, [browserTz]);

  const isAutoDetected = browserTz && canonicalValue === normalizeIanaTimezone(browserTz);

  // All timezones database
  const allTimezones = useMemo(() => getAllTimezones(), []);

  // Filtered timezones based on search query
  const filteredTimezones = useMemo(() => {
    return searchTimezones(searchQuery, allTimezones);
  }, [searchQuery, allTimezones]);

  // Grouped by region
  const regionGroups = useMemo(() => {
    return groupTimezonesByRegion(filteredTimezones);
  }, [filteredTimezones]);

  // Flattened array of selectable items for keyboard navigation
  const flatItems = useMemo(() => {
    const items: TimezoneItem[] = [];
    for (const group of regionGroups) {
      for (const item of group.timezones) {
        items.push(item);
      }
    }
    return items;
  }, [regionGroups]);

  // Open popover
  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setSearchQuery('');
    // Set focused index to the currently selected item if visible
    const idx = flatItems.findIndex(item => item.iana === canonicalValue);
    setFocusedIndex(idx >= 0 ? idx : 0);
  };

  // Close popover
  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
    setFocusedIndex(-1);
    triggerRef.current?.focus();
  };

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 30);
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Scroll focused option into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listboxRef.current) {
      const activeEl = listboxRef.current.querySelector(`[data-index="${focusedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [focusedIndex, isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;

      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => {
          if (flatItems.length === 0) return -1;
          const next = prev + 1;
          return next >= flatItems.length ? 0 : next;
        });
        break;

      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => {
          if (flatItems.length === 0) return -1;
          const next = prev - 1;
          return next < 0 ? flatItems.length - 1 : next;
        });
        break;

      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < flatItems.length) {
          handleSelect(flatItems[focusedIndex].iana);
        }
        break;

      case 'Home':
        e.preventDefault();
        if (flatItems.length > 0) setFocusedIndex(0);
        break;

      case 'End':
        e.preventDefault();
        if (flatItems.length > 0) setFocusedIndex(flatItems.length - 1);
        break;
    }
  };

  const handleSelect = (iana: string) => {
    onChange(iana);
    handleClose();
  };

  // Helper to get flat index for an item
  let runningIndex = 0;

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Closed State Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id={inputId}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label={`Operating timezone: ${activeInfo.iana}`}
        disabled={disabled}
        onClick={() => (isOpen ? handleClose() : handleOpen())}
        className={`w-full flex items-center justify-between text-left text-sm border rounded-lg pl-9 pr-3 py-2.5 transition-all bg-white ${
          isOpen
            ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
            : 'border-slate-300 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}`}
      >
        <div className="absolute left-3 top-3 text-slate-400 pointer-events-none">
          <Clock className="w-4 h-4" />
        </div>

        <div className="flex items-center gap-2 min-w-0 pr-2">
          <span className="font-medium text-slate-900 truncate">
            {activeInfo.iana}
          </span>
          <span className="text-slate-500 text-xs truncate hidden sm:inline">
            · {activeInfo.longName}
          </span>
          <span className="text-slate-400 text-xs shrink-0 font-mono">
            ({activeInfo.offset})
          </span>

          {isAutoDetected && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-1.5 py-0.5 rounded-full shrink-0">
              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
              Auto-detected
            </span>
          )}
        </div>

        <div className="shrink-0 text-slate-400 ml-2">
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
        </div>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div 
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[380px]"
          style={{ minWidth: '320px' }}
        >
          {/* Quick "Use my timezone" option */}
          {browserTzInfo && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/80">
              <button
                type="button"
                onClick={() => handleSelect(browserTzInfo.iana)}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                  canonicalValue === browserTzInfo.iana
                    ? 'bg-blue-50 text-blue-900 border border-blue-200/70'
                    : 'hover:bg-white text-slate-700 hover:text-slate-900 border border-transparent'
                }`}
                title="Use your browser's local timezone"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-semibold flex items-center gap-1.5">
                      <span>Use my timezone</span>
                      <span className="text-[10px] font-normal text-slate-500">({browserTzInfo.city})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                      {browserTzInfo.iana} · {browserTzInfo.offset}
                    </div>
                  </div>
                </div>
                {canonicalValue === browserTzInfo.iana && (
                  <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                )}
              </button>
            </div>
          )}

          {/* Search Input Bar */}
          <div className="p-2.5 border-b border-slate-100 relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setFocusedIndex(0);
              }}
              placeholder="Search timezones (e.g. India, New York, London, PST)..."
              className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-slate-50/50"
              aria-label="Search timezones"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFocusedIndex(0);
                  searchInputRef.current?.focus();
                }}
                className="absolute right-4 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Timezone Results List */}
          <div
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-label="Available Timezones"
            className="overflow-y-auto flex-1 divide-y divide-slate-100 text-xs py-1"
          >
            {regionGroups.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <Clock className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="font-medium text-slate-700">No timezones found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Try searching by country, city name, or IANA identifier.
                </p>
              </div>
            ) : (
              regionGroups.map(group => (
                <div key={group.region} className="py-1">
                  {/* Region Header */}
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/90 sticky top-0 z-10 border-y border-slate-100/80">
                    {group.region}
                  </div>

                  {/* Region Options */}
                  <div className="space-y-0.5 px-1 py-1">
                    {group.timezones.map(item => {
                      const itemIndex = runningIndex++;
                      const isSelected = item.iana === canonicalValue;
                      const isFocused = itemIndex === focusedIndex;

                      return (
                        <div
                          key={item.iana}
                          data-index={itemIndex}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelect(item.iana)}
                          onMouseEnter={() => setFocusedIndex(itemIndex)}
                          className={`px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-blue-50 text-blue-900 font-semibold'
                              : isFocused
                              ? 'bg-slate-100/80 text-slate-900'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900 text-xs">
                                {item.city}
                              </span>
                              <span className="text-slate-400 text-[11px] font-mono">
                                ({item.offset})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              {item.iana} · {item.longName}
                            </div>
                          </div>

                          {isSelected && (
                            <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>{flatItems.length} {flatItems.length === 1 ? 'timezone' : 'timezones'}</span>
            <span className="text-[10px] text-slate-400">↑↓ to navigate · Enter to select · Esc to close</span>
          </div>
        </div>
      )}
    </div>
  );
}
