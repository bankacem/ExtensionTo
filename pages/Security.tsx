
import React from 'react';

const Security: React.FC = () => (
  <div className="max-w-3xl mx-auto px-6 py-20">
    <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Security First</h1>
    <div className="bg-blue-50 p-8 rounded-[32px] border border-blue-100 mb-8">
      <h2 className="text-xl font-bold text-blue-900 mb-4">Our Verification Process</h2>
      <p className="text-blue-800 text-sm leading-relaxed">
        Every extension on our platform undergoes a static analysis scan and a manual source-code audit to ensure there are no hidden trackers or malicious scripts.
      </p>
    </div>
    <p className="text-gray-600 leading-relaxed">We maintain a real-time database of flagged permissions and suspicious API calls to protect our users.</p>
  </div>
);

export default Security;
