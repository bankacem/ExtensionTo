
import React from 'react';

const Compliance: React.FC = () => (
  <div className="max-w-3xl mx-auto px-6 py-20 text-gray-600">
    <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Compliance & Standards</h1>
    <p className="mb-6">ExtensionTo strictly adheres to international web safety standards and GDPR privacy regulations.</p>
    <ul className="list-disc pl-6 space-y-4">
      <li><strong>GDPR Ready:</strong> Zero storage of personal identifier data.</li>
      <li><strong>Manifest V3:</strong> Only compliant extensions are featured.</li>
      <li><strong>Content Security:</strong> Mandatory CSP headers for all recommended tools.</li>
    </ul>
  </div>
);

export default Compliance;
