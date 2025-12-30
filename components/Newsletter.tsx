
import React, { useState } from 'react';

const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto bg-blue-600 rounded-[40px] p-8 md:p-16 text-center relative overflow-hidden shadow-2xl shadow-blue-200">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
          </svg>
        </div>
        
        <div className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
            Stay ahead of the curve.
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
            Join 5,000+ professionals receiving weekly curated browser tools and privacy insights.
          </p>

          {subscribed ? (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl inline-block animate-in zoom-in-95">
              <span className="text-white font-bold text-lg">✨ Welcome to the elite! Check your inbox.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <input 
                type="email" 
                placeholder="Enter your professional email" 
                required
                className="flex-grow px-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-blue-200 focus:bg-white focus:text-gray-900 outline-none transition-all font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button 
                type="submit"
                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl hover:bg-blue-50 transition-all shadow-lg"
              >
                Join Now
              </button>
            </form>
          )}
          <p className="mt-6 text-blue-200 text-xs font-medium uppercase tracking-widest">No spam. Ever. Just pure utility.</p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
