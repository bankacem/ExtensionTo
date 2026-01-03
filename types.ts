
export interface Extension {
  id: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  icon: string;
  rating: number;
  users: string;
  category: string;
  features: string[];
  version: string;
  lastUpdated: string;
  size: string;
  storeUrl: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string; // Supports HTML
  category: string;
  tags?: string;
  date: string; // Display date
  publishDate: string; // ISO format for scheduling
  readTime: string;
  image: string; // URL or Emoji
  featured?: boolean;
  status?: 'draft' | 'published' | 'scheduled';
  seoTitle?: string;
  seoDesc?: string;
  seoKeywords?: string;
}

export type PageType = 
  | 'home' 
  | 'detail' 
  | 'privacy' 
  | 'terms' 
  | 'blog' 
  | 'blog-post'
  | 'features' 
  | 'compliance' 
  | 'security' 
  | 'contact' 
  | 'help' 
  | 'report-abuse'
  | 'cms'
  | 'batch-studio';

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface MediaItem {
  id: string;
  name: string;
  data: string;
  type: string;
}

export interface BatchItem {
  id: string;
  originalImage: string;
  aiAnalysis: {
    focalPoint: { x: number; y: number };
    description: string;
  } | null;
  manualFocalPoint: { x: number; y: number } | null;
  status: 'pending' | 'analyzing' | 'ready' | 'error';
}
