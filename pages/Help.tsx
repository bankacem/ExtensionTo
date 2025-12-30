
import React from 'react';

const Help: React.FC = () => (
  <div className="max-w-3xl mx-auto px-6 py-20">
    <h1 className="text-4xl font-extrabold text-gray-900 mb-12">Help Center</h1>
    <div className="space-y-6">
      <div className="p-6 bg-white rounded-3xl border border-gray-100 apple-shadow">
        <h3 className="font-bold text-gray-900 mb-2">How to install extensions?</h3>
        <p className="text-sm text-gray-500">Click the 'Add to Chrome' button on any extension detail page to be redirected to the official store.</p>
      </div>
      <div className="p-6 bg-white rounded-3xl border border-gray-100 apple-shadow">
        <h3 className="font-bold text-gray-900 mb-2">Are these tools safe?</h3>
        <p className="text-sm text-gray-500">Yes, every tool is manually reviewed and verified for safety and performance.</p>
      </div>
    </div>
  </div>
);

export default Help;
