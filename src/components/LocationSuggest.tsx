import { useState, useRef, useEffect, useMemo } from "react";
import { MapPin, X } from "lucide-react";
import { getLocations } from "@/hooks/useLocalData";

interface LocationSuggestProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function LocationSuggest({ value, onChange, placeholder }: LocationSuggestProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Read locations from localStorage
  const allLocations = useMemo(() => getLocations(), []);

  const filtered = inputValue.trim()
    ? allLocations.filter((loc) =>
        loc.toLowerCase().includes(inputValue.toLowerCase())
      ).slice(0, 6)
    : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (loc: string) => {
    setInputValue(loc);
    onChange(loc);
    setShowSuggestions(false);
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    onChange(val);
    setShowSuggestions(true);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => inputValue.trim() && setShowSuggestions(true)}
          placeholder={placeholder || "Contoh: Sekretariat UFO UGM"}
          className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => { setInputValue(""); onChange(""); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => handleSelect(loc)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 hover:text-red-700 transition-colors flex items-start gap-2"
            >
              <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
              <span>{loc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
