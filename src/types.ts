export interface PortfolioItem {
  id: string;
  title: string;
  category: string; // '攝影' | '創作' | '設計'
  date: string;
  summary: string;
  content: string;
  imageUrl: string;
  views: number;
  likes: number;
  commentsCount: number;
  tags: string[];
}

export interface Comment {
  id: string;
  itemId: string;
  author: string;
  content: string;
  createdAt: string;
  isApproved: boolean;
}

export type UserRole = 'admin' | 'editor';

export interface User {
  username: string;
  role: UserRole;
  passwordHash: string; // SHA-256 for demo
}

export interface AnalyticsLog {
  id: string;
  timestamp: string;
  type: 'page_view' | 'like' | 'comment';
  itemId?: string;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  referrer: string;
}

export interface SEOConfiguration {
  title: string;
  description: string;
  keywords: string;
  author: string;
}
