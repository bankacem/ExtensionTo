
import React from 'react';
import { Extension } from '../types';

interface ExtensionCardProps {
  extension: Extension;
  onClick: () => void;
}

const ExtensionCard: React.FC<ExtensionCardProps> = ({ extension, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group bg-white p-6 rounded-3xl border border-gray-100 apple-shadow cursor-pointer transition-all duration-300 flex flex-col h-full"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
          {extension.icon}
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{extension.category}</span>
          <div className="flex items-center mt-1">
            <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-semibold text-gray-600 ml-1">{extension.rating}</span>
          </div>
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
        {extension.name}
      </h3>
      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed flex-grow">
        {extension.shortDescription}
      </p>
      
      <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">{extension.users} users</span>
        <span className="text-xs font-semibold text-blue-600 group-hover:underline">View Details →</span>
      </div>
    </div>
  );
};

export default ExtensionCard;
