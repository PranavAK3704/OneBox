'use client';

import { Stats } from '@/types';

interface StatsCardsProps {
  stats: Stats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { label: 'Total Emails', value: stats.total, icon: '📧', color: 'card-blue' },
    { label: 'Interested', value: stats.interested, icon: '🎯', color: 'card-green' },
    { label: 'Meeting Booked', value: stats.meetingBooked, icon: '📅', color: 'card-purple' },
    { label: 'Not Interested', value: stats.notInterested, icon: '❌', color: 'card-gray' },
    { label: 'Spam', value: stats.spam, icon: '🚫', color: 'card-red' },
    { label: 'Out of Office', value: stats.outOfOffice, icon: '🏖️', color: 'card-yellow' },
  ];

  return (
    <div className="stats-cards">
      {cards.map((card, index) => (
        <div key={index} className={`stat-card ${card.color}`}>
          <div className="stat-icon">{card.icon}</div>
          <div className="stat-content">
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}