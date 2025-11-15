'use client';

import { FilterOptions } from '@/types';

interface FilterBarProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
}

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const handleChange = (key: keyof FilterOptions, value: string) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const hasActiveFilters = filters.accountId || filters.category || filters.folder;

  const clearFilters = () => {
    onChange({
      accountId: '',
      category: '',
      folder: '',
    });
  };

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label className="filter-label">Account</label>
        <select
          className="filter-select"
          value={filters.accountId}
          onChange={(e) => handleChange('accountId', e.target.value)}
        >
          <option value="">All Accounts</option>
          <option value="account1">Account 1</option>
          <option value="account2">Account 2</option>
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Category</label>
        <select
          className="filter-select"
          value={filters.category}
          onChange={(e) => handleChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Interested">Interested</option>
          <option value="Meeting Booked">Meeting Booked</option>
          <option value="Not Interested">Not Interested</option>
          <option value="Spam">Spam</option>
          <option value="Out of Office">Out of Office</option>
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Folder</label>
        <select
          className="filter-select"
          value={filters.folder}
          onChange={(e) => handleChange('folder', e.target.value)}
        >
          <option value="">All Folders</option>
          <option value="INBOX">Inbox</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button className="clear-filters-button" onClick={clearFilters}>
          Clear Filters
        </button>
      )}
    </div>
  );
}