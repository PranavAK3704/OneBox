export interface Email {
  messageId: string;
  accountId: string;
  folder: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  category: 'Interested' | 'Meeting Booked' | 'Not Interested' | 'Spam' | 'Out of Office';
  date: string;
  uid?: number;
}

export interface FilterOptions {
  accountId: string;
  category: string;
  folder: string;
}

export interface Stats {
  total: number;
  interested: number;
  meetingBooked: number;
  notInterested: number;
  spam: number;
  outOfOffice: number;
}