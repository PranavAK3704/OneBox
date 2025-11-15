'use client';

import { useState, useEffect } from 'react';
import EmailList from '@/components/EmailList';
import EmailDetail from '@/components/EmailDetail';
import SearchBar from '@/components/SearchBar';
import FilterBar from '@/components/FilterBar';
import StatsCards from '@/components/StatsCards';
import { Email, FilterOptions } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function Home() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    accountId: '',
    category: '',
    folder: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSync, setLastSync] = useState<Date>(new Date());

  // 👇 Fix hydration issues: only render time on client
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    loadEmails();
    
    const interval = setInterval(() => {
      loadEmails(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [filters]);

  const loadEmails = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      if (filters.accountId) params.append('accountId', filters.accountId);
      if (filters.category) params.append('category', filters.category);
      if (filters.folder) params.append('folder', filters.folder);

      const response = await fetch(`${API_BASE}/emails?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }

      const data = await response.json();
      setEmails(data.emails || []);
      setLastSync(new Date());
      
      if (!selectedEmail && data.emails?.length > 0) {
        setSelectedEmail(data.emails[0]);
      }
    } catch (err: any) {
      setError('Error connecting to backend. Make sure server is running on port 3000');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      loadEmails();
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query });
      if (filters.accountId) params.append('accountId', filters.accountId);
      if (filters.folder) params.append('folder', filters.folder);

      const response = await fetch(`${API_BASE}/emails/search?${params}`);
      const data = await response.json();
      
      setEmails(data.emails || []);
      if (data.emails?.length > 0) {
        setSelectedEmail(data.emails[0]);
      }
    } catch (err: any) {
      setError('Search error');
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => ({
    total: emails.length,
    interested: emails.filter(e => e.category === 'Interested').length,
    meetingBooked: emails.filter(e => e.category === 'Meeting Booked').length,
    notInterested: emails.filter(e => e.category === 'Not Interested').length,
    spam: emails.filter(e => e.category === 'Spam').length,
    outOfOffice: emails.filter(e => e.category === 'Out of Office').length,
  });

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="logo">📧 Onebox</h1>
            <p className="tagline">AI-Powered Email Aggregator</p>
          </div>

          <div className="sync-indicator">
            <span className="sync-dot"></span>
            <span className="sync-text">
              Last synced: {mounted ? lastSync.toLocaleTimeString() : '...'}
            </span>
          </div>
        </div>
      </header>

      <div className="search-section">
        <SearchBar onSearch={handleSearch} value={searchQuery} />
      </div>

      <div className="stats-section">
        <StatsCards stats={getStats()} />
      </div>

      <div className="filter-section">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {error && (
        <div className="error-banner">
          <span>❌</span>
          <span>{error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      <div className="main-content">
        <div className="email-list-panel">
          <EmailList
            emails={emails}
            selectedEmail={selectedEmail}
            onSelectEmail={setSelectedEmail}
            loading={loading}
          />
        </div>

        <div className="email-detail-panel">
          <EmailDetail email={selectedEmail} loading={loading} />
        </div>
      </div>
    </div>
  );
}
