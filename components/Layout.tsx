
import React, { useState } from 'react';
import { BRAND_LINKS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate: (page: string) => void;
  currentPage: string;
}

const Layout: React.FC<LayoutProps> = ({ children, onNavigate, currentPage }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', hash: '#home' },
    { label: 'Blog', hash: '#blog' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 glass-header border-b border-gray-100">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate('#home')}
          >
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-100">E</div>
            <span className="text-xl font-bold tracking-tight text-gray-900">ExtensionTo</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-500">
            {navLinks.map((link) => (
              <button 
                key={link.hash}
                onClick={() => onNavigate(link.hash)}
                className={`${currentPage === link.hash.replace('#', '') ? 'text-blue-600' : 'hover:text-gray-900'} transition-colors`}
              >
                {link.label}
              </button>
            ))}
            
            <a 
              href={BRAND_LINKS.mainSite} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-600 transition-colors border-l pl-8 border-gray-100"
            >
              Main Site ↗
            </a>

            <button 
              onClick={() => onNavigate('#contact')}
              className="bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-black transition-all text-xs font-bold"
            >
              Contact Us
            </button>
          </div>

          <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </nav>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white p-6 border-b border-gray-100 flex flex-col gap-4">
            {navLinks.map((link) => (
              <button key={link.hash} onClick={() => { onNavigate(link.hash); setIsMobileMenuOpen(false); }} className="text-left font-bold text-gray-900">{link.label}</button>
            ))}
            <a href={BRAND_LINKS.mainSite} className="font-bold text-blue-600">Main Site ↗</a>
          </div>
        )}
      </header>

      <main className="flex-grow">{children}</main>

      <footer className="bg-gray-50 border-t border-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-sm text-gray-500">
          <div className="md:col-span-2">
            <h3 className="text-gray-900 font-bold text-lg mb-4">ExtensionTo</h3>
            <p className="max-w-xs leading-relaxed mb-6">The professional choice for browser extension discovery. We focus on security, speed, and privacy above all else.</p>
            <div className="flex gap-4">
              <a href={BRAND_LINKS.twitter} className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-blue-400 transition-colors">𝕏</a>
              <a href={BRAND_LINKS.github} className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-gray-900 transition-colors">GitHub</a>
            </div>
          </div>
          <div>
            <h4 className="text-gray-900 font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><button onClick={() => onNavigate('#home')} className="hover:text-blue-600">Browse Store</button></li>
              <li><button onClick={() => onNavigate('#blog')} className="hover:text-blue-600">Latest News</button></li>
              <li><button onClick={() => onNavigate('#features')} className="hover:text-blue-600">Features</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-gray-900 font-bold mb-4">Support & Admin</h4>
            <ul className="space-y-2">
              <li><button onClick={() => onNavigate('#help')} className="hover:text-blue-600">Help Center</button></li>
              <li><button onClick={() => onNavigate('#privacy')} className="hover:text-blue-600">Privacy</button></li>
              <li><button onClick={() => onNavigate('#cms')} className="text-blue-600 font-bold hover:underline">Admin Console (CMS) ⚙️</button></li>
              <li><button onClick={() => onNavigate('#report-abuse')} className="hover:text-red-600">Report Issue</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-16 pt-8 border-t border-gray-200/50 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <span>&copy; 2024 ExtensionTo. All rights reserved.</span>
          <div className="flex gap-6">
            <button onClick={() => onNavigate('#terms')}>Terms</button>
            <button onClick={() => onNavigate('#privacy')}>Privacy</button>
            <button onClick={() => onNavigate('#security')}>Security</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
