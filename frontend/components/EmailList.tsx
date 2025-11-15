'use client';

import React from 'react';
import { Email } from '@/types';

interface EmailListProps {
  emails: Email[];
  selectedEmail: Email | null;
  onSelectEmail: (email: Email) => void;
  loading: boolean;
}

const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedEmail,
  onSelectEmail,
  loading,
}) => {
  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Interested': 'category-interested',
      'Meeting Booked': 'category-meeting',
      'Not Interested': 'category-not-interested',
      'Spam': 'category-spam',
      'Out of Office': 'category-ooo',
    };
    return colors[category] || 'category-default';
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const extractName = (email: string): string => {
    const match = email.match(/^"?([^"<]+)"?\s*</);
    return match ? match[1].trim() : email.split('@')[0];
  };

  if (loading) {
    return (
      <div className="email-list">
        <div className="list-header">
          <h2>Loading...</h2>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="email-item skeleton">
            <div className="skeleton-line"></div>
            <div className="skeleton-line short"></div>
          </div>
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="email-list">
        <div className="list-header">
          <h2>Inbox</h2>
          <span className="count">0</span>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No emails found</h3>
          <p>Try adjusting your filters or search query</p>
        </div>
      </div>
    );
  }

  return (
    <div className="email-list">
      <div className="list-header">
        <h2>Inbox</h2>
        <span className="count">{emails.length}</span>
      </div>

      <div className="list-items">
        {emails.map((email) => (
          <div
            key={email.messageId}
            className={`email-item ${selectedEmail?.messageId === email.messageId ? 'selected' : ''}`}
            onClick={() => onSelectEmail(email)}
          >
            <div className="email-item-header">
              <div className="sender-info">
                <div className="sender-avatar">
                  {extractName(email.from).charAt(0).toUpperCase()}
                </div>
                <div className="sender-details">
                  <span className="sender-name">{extractName(email.from)}</span>
                  <span className="email-time">{formatDate(email.date)}</span>
                </div>
              </div>
              <div className={`category-badge ${getCategoryColor(email.category)}`}>
                {email.category}
              </div>
            </div>

            <div className="email-item-content">
              <h3 className="email-subject">{email.subject || '(No Subject)'}</h3>
              <p className="email-preview">
                {email.body.substring(0, 100)}...
              </p>
            </div>

            <div className="email-item-footer">
              <span className="account-tag">{email.accountId}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailList;