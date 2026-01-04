
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
  content: string;
  category: string;
  tags?: string;
  date: string;
  publishDate: string;
  readTime: string;
  image: string;
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
  | 'suite' // New Professional Suite Route
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
