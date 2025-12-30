
import React from 'react';

const ReportAbuse: React.FC = () => (
  <div className="max-w-3xl mx-auto px-6 py-20">
    <div className="bg-red-50 p-10 rounded-[40px] border border-red-100">
      <h1 className="text-3xl font-extrabold text-red-900 mb-4">Report Abuse</h1>
      <p className="text-red-700 mb-8 leading-relaxed">Safety is our priority. If you've found a malicious extension, please report it immediately.</p>
      <input className="p-4 rounded-2xl bg-white border border-red-100 w-full mb-4" placeholder="Extension Name or URL" />
      <textarea className="p-4 rounded-2xl bg-white border border-red-100 w-full h-32 mb-4" placeholder="Describe the issue..."></textarea>
      <button className="bg-red-600 text-white font-bold py-4 px-8 rounded-2xl w-full">Submit Report</button>
    </div>
  </div>
);

export default ReportAbuse;
