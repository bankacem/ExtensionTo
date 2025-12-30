
import React from 'react';

const Contact: React.FC = () => (
  <div className="max-w-3xl mx-auto px-6 py-20">
    <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Contact Us</h1>
    <form className="space-y-6" onSubmit={e => e.preventDefault()}>
      <div className="grid grid-cols-2 gap-4">
        <input className="p-4 rounded-2xl bg-gray-50 border border-gray-100 w-full" placeholder="Name" />
        <input className="p-4 rounded-2xl bg-gray-50 border border-gray-100 w-full" placeholder="Email" />
      </div>
      <textarea className="p-4 rounded-2xl bg-gray-50 border border-gray-100 w-full h-40" placeholder="Your Message"></textarea>
      <button className="bg-blue-600 text-white font-bold py-4 px-8 rounded-2xl w-full">Send Message</button>
    </form>
  </div>
);

export default Contact;
