
import React from 'react';

const Privacy: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 animate-in fade-in duration-500">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Privacy Policy</h1>
      <div className="prose prose-slate prose-blue max-w-none text-gray-600 space-y-6">
        <p className="text-lg leading-relaxed italic">
          Last Updated: January 15, 2024
        </p>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Our Core Privacy Philosophy</h2>
          <p>At ExtensionTo, we believe your data belongs to you. Our platform and the extensions we feature are built with a "Privacy by Design" approach. We maintain a strict zero-data-collection standard for all utility extensions hosted on our hub.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Data Collection</h2>
          <p><strong>ExtensionTo Hub Website:</strong> We do not use tracking cookies or persistent identifiers. We do not store your IP address or browsing behavior.</p>
          <p><strong>Hosted Extensions:</strong> Every extension in our library is vetted to ensure it does not collect, transmit, or sell user data. Any local storage used by an extension (such as settings or preferences) remains strictly on your local machine and is never synced to our servers unless you explicitly enable a cloud-sync feature (where applicable).</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Permissions</h2>
          <p>Our extensions only request the minimum permissions required to function. If an extension requests "Read and change all your data on the websites you visit," it is only to apply its specific functionality (like ad blocking or UI cleanup) and not for monitoring purposes.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Security</h2>
          <p>We use industry-standard encryption for our website. For extensions, we manually audit the source code for potential vulnerabilities before listing them on our platform.</p>
        </section>
        <div className="p-8 bg-gray-50 border border-gray-100 rounded-3xl mt-12">
          <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-widest">Have Questions?</h3>
          <p className="text-sm mb-4">If you have any questions regarding your privacy, please reach out to our legal team.</p>
          <button className="text-blue-600 font-bold text-sm hover:underline">privacy@extensionto.com</button>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
