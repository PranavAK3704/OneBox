'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  value: string;
}

export default function SearchBar({ onSearch, value }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onSearch('');
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search emails by subject, sender, or content..."
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
        />
        {localValue && (
          <button
            type="button"
            className="clear-button"
            onClick={handleClear}
          >
            ✕
          </button>
        )}
      </div>
      <button type="submit" className="search-button">
        Search
      </button>
    </form>
  );
}