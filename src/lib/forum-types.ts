import { Timestamp } from 'firebase/firestore';

export interface ForumCategory {
  id: string;
  name: {
    ar: string;
    en?: string;
  };
  description: {
    ar: string;
    en?: string;
  };
  icon: string;
  order: number;
  threadCount: number;
  lastPostAt?: Timestamp;
}

export interface ForumThread {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  replyCount: number;
  viewCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isSolved: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ForumReply {
  id: string;
  threadId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
