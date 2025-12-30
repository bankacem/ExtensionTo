
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
  date: string; // للعرض النصي (مثلاً: 12 مايو)
  publishDate: string; // للجدولة (ISO format: 2024-05-12T10:00)
  readTime: string;
  image: string; // يمكن أن يكون رابط URL أو Emoji
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
  | 'cms';
