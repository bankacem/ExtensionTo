
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
  content: string; // يدعم HTML
  category: string;
  tags?: string;
  date: string; // للعرض النصي (مثلاً: 12 مايو)
  publishDate: string; // للجدولة (ISO format: 2024-05-12T10:00)
  readTime: string;
  image: string; // يمكن أن يكون رابط URL أو Emoji
  featured?: boolean;
  status?: 'draft' | 'published' | 'scheduled';
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
