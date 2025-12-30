
import React from 'react';

const Terms: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 animate-in fade-in duration-500">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Terms of Service</h1>
      <div className="prose prose-slate prose-blue max-w-none text-gray-600 space-y-6">
        <p className="text-lg leading-relaxed italic">
          Last Updated: January 15, 2024
        </p>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
          <p>By accessing and using ExtensionTo, you agree to comply with and be bound by these Terms of Service. If you do not agree, please refrain from using our services.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Use of Extensions</h2>
          <p>Extensions found on this hub are provided "as-is". While we vet every extension for safety and performance, the final responsibility for usage lies with the user. You must adhere to the Google Chrome Web Store's terms of service when installing software from their platform.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Intellectual Property</h2>
          <p>The ExtensionTo brand, website design, and logos are property of ExtensionTo. The icons and names of featured extensions belong to their respective creators.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Limitation of Liability</h2>
          <p>ExtensionTo shall not be liable for any damages arising from the use or inability to use the extensions listed. We do not guarantee 100% uptime for featured tools.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Modifications</h2>
          <p>We reserve the right to modify these terms at any time. Your continued use of the platform after changes are posted constitutes your acceptance of the new terms.</p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
