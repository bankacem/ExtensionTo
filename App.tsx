
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Detail from './pages/Detail';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Blog from './pages/Blog';
import BlogPostDetail from './pages/BlogPostDetail';
import Features from './pages/Features';
import Compliance from './pages/Compliance';
import Security from './pages/Security';
import Contact from './pages/Contact';
import Help from './pages/Help';
import ReportAbuse from './pages/ReportAbuse';
import AdminCMS from './pages/AdminCMS';
import BatchStudio from './pages/BatchStudio';
import { PageType, BlogPost, Extension } from './types';

// نظام التتبع البسيط
const trackEvent = (type: 'view' | 'click' | 'install', metadata?: any) => {
  const stats = JSON.parse(localStorage.getItem('et_analytics') || '[]');
  stats.push({
    type,
    path: window.location.hash,
    timestamp: new Date().toISOString(),
    ...metadata
  });
  // الاحتفاظ بآخر 1000 حدث فقط لتوفير المساحة
  if (stats.length > 1000) stats.shift();
  localStorage.setItem('et_analytics', JSON.stringify(stats));
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [selectedExtensionId, setSelectedExtensionId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [dynamicPosts, setDynamicPosts] = useState<BlogPost[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const visiblePosts = dynamicPosts.filter(post => {
    if (!post.publishDate) return true;
    return new Date(post.publishDate).getTime() <= Date.now();
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [blogResponse, extensionsResponse] = await Promise.all([
          fetch('/api/blog'),
          fetch('/api/extensions')
        ]);

        if (!blogResponse.ok || !extensionsResponse.ok) {
          throw new Error('Network response was not ok');
        }

        const blogData = await blogResponse.json();
        const extensionsData = await extensionsResponse.json();

        setDynamicPosts(blogData);
        setExtensions(extensionsData);

      } catch (error) {
        console.error("Failed to fetch data:", error);
        setError("Failed to load data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const updateSEO = (title: string, description: string) => {
      document.title = `${title} | ExtensionTo`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      }
    };

    const handleHashChange = () => {
      const hash = window.location.hash || '#home';
      
      trackEvent('view');

      if (hash.startsWith('#detail/')) {
        const id = hash.replace('#detail/', '');
        const ext = extensions.find(e => e.id === id);
        if (ext) {
          updateSEO(ext.name, ext.shortDescription);
          trackEvent('click', { itemId: id, category: 'extension' });
        }
        setSelectedExtensionId(id);
        setCurrentPage('detail');
      } else if (hash.startsWith('#blog/')) {
        const id = hash.replace('#blog/', '');
        const post = visiblePosts.find(p => p.id === id);
        if (post) {
          updateSEO(post.title, post.excerpt);
          trackEvent('click', { itemId: id, category: 'blog' });
          setSelectedPostId(id);
          setCurrentPage('blog-post');
        } else {
          window.location.hash = '#blog';
        }
      } else if (hash === '#blog') {
        updateSEO('Journal', 'Privacy news and expert guides.');
        setCurrentPage('blog');
      } else if (hash === '#cms') {
        updateSEO('Writer Dashboard', 'Manage directory content.');
        setCurrentPage('cms');
      } else if (hash === '#batch-studio') {
        updateSEO('Batch Asset Studio', 'Bulk image processing for extensions.');
        setCurrentPage('batch-studio');
      } else if (hash === '#privacy') {
        updateSEO('Privacy Policy', 'Your data is yours.');
        setCurrentPage('privacy');
      } else if (hash === '#terms') {
        updateSEO('Terms of Service', 'Usage guidelines.');
        setCurrentPage('terms');
      } else if (hash === '#features') {
        updateSEO('Features', 'Why ExtensionTo.');
        setCurrentPage('features');
      } else if (hash === '#contact') {
        updateSEO('Contact', 'Get in touch.');
        setCurrentPage('contact');
      } else if (hash === '#help') {
        updateSEO('Help Center', 'Guides and FAQ.');
        setCurrentPage('help');
      } else if (hash === '#report-abuse') {
        updateSEO('Report Abuse', 'Safety first.');
        setCurrentPage('report-abuse');
      } else if (hash === '#compliance') {
        updateSEO('Compliance', 'Regulatory standards.');
        setCurrentPage('compliance');
      } else if (hash === '#security') {
        updateSEO('Security', 'Verification process.');
        setCurrentPage('security');
      } else {
        updateSEO('Home', 'Premium Browser Extensions Hub.');
        setCurrentPage('home');
      }
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [dynamicPosts, visiblePosts, extensions]);

  const navigateTo = (hash: string) => {
    window.location.hash = hash;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (currentPage === 'cms') {
    return (
      <Layout onNavigate={navigateTo} currentPage={currentPage}>
        <AdminCMS />
      </Layout>
    );
  }

  const selectedExtension = extensions.find(e => e.id === selectedExtensionId);
  const selectedPost = visiblePosts.find(p => p.id === selectedPostId);

  return (
    <Layout onNavigate={navigateTo} currentPage={currentPage}>
      {currentPage === 'home' && <Home onSelect={(id) => navigateTo(`#detail/${id}`)} />}
      {currentPage === 'detail' && selectedExtension && <Detail extension={selectedExtension} onBack={() => navigateTo('#home')} />}
      {currentPage === 'privacy' && <Privacy />}
      {currentPage === 'terms' && <Terms />}
      {currentPage === 'blog' && <Blog posts={visiblePosts} onPostSelect={(id) => navigateTo(`#blog/${id}`)} />}
      {currentPage === 'blog-post' && selectedPost && <BlogPostDetail post={selectedPost} onBack={() => navigateTo('#blog')} />}
      {currentPage === 'features' && <Features />}
      {currentPage === 'contact' && <Contact />}
      {currentPage === 'help' && <Help />}
      {currentPage === 'report-abuse' && <ReportAbuse />}
      {currentPage === 'compliance' && <Compliance />}
      {currentPage === 'security' && <Security />}
      {currentPage === 'batch-studio' && <BatchStudio />}
    </Layout>
  );
};

export default App;
