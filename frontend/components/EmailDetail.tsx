import React from 'react';
import { Email } from '../types';

interface EmailDetailProps {
  email: Email | null;
  loading: boolean;
}

const EmailDetail: React.FC<EmailDetailProps> = ({ email, loading }) => {
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

  const formatDateTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="email-detail">
        <div className="detail-skeleton">
          <div className="skeleton-line"></div>
          <div className="skeleton-line short"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-block"></div>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="email-detail">
        <div className="no-selection">
          <div className="no-selection-icon">✉️</div>
          <h2>Select an email</h2>
          <p>Choose an email from the list to view its contents</p>
        </div>
      </div>
    );
  }

  return (
    <div className="email-detail">
      <div className="detail-header">
        <div className="detail-title-row">
          <h1 className="detail-subject">{email.subject || '(No Subject)'}</h1>
          <div className={`detail-category ${getCategoryColor(email.category)}`}>
            {email.category}
          </div>
        </div>

        <div className="detail-meta">
          <div className="meta-item">
            <span className="meta-label">From:</span>
            <span className="meta-value">{email.from}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">To:</span>
            <span className="meta-value">{email.to}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Date:</span>
            <span className="meta-value">{formatDateTime(email.date)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Account:</span>
            <span className="meta-value account-badge">{email.accountId}</span>
          </div>
        </div>
      </div>

      <div className="detail-body">
        <div className="body-content">
          {email.body.split('\n').map((line, idx) => (
            <p key={idx}>{line || '\u00A0'}</p>
          ))}
        </div>
      </div>

      <div className="detail-footer">
        <div className="footer-info">
          <span>Message ID: {email.messageId}</span>
          {email.uid && <span>UID: {email.uid}</span>}
        </div>
      </div>
    </div>
  );
};

export default EmailDetail;