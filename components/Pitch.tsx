
import React from 'react';

const Pitch: React.FC = () => {
  const googleTech = [
    { name: 'Google Gemini API', desc: 'Core intelligence engine for multi-modal data reasoning.', icon: 'fa-google' },
    { name: 'Chrome Storage API', desc: 'Fast, secure local storage for your academic documents.', icon: 'fa-hard-drive' },
    { name: 'Local First Architecture', desc: 'Zero cloud latency and maximum data privacy.', icon: 'fa-user-shield' }
  ];

  const aiTools = [
    { name: 'Gemini 3 Flash', desc: 'Next-gen multimodal model optimized for speed and structured data extraction.', icon: 'fa-bolt-lightning' },
    { name: 'Contextual AI', desc: 'Analyzes your specific college files for personalized help.', icon: 'fa-brain' },
    { name: 'Hinglish Support', desc: 'Custom-tuned persona for natural bilingual academic support.', icon: 'fa-language' }
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-in fade-in zoom-in-95 duration-700">
      <div className="w-full max-w-5xl bg-gradient-to-br from-indigo-950 via-slate-950 to-black rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 relative p-8 md:p-16">
        
        {/* Aesthetic Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[80px] -ml-20 -mb-20"></div>
        
        <header className="relative z-10 text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
            <i className="fa-solid fa-sparkles"></i> Project Documentation
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
            UniHub <span className="text-indigo-500">Local</span>
          </h2>
          <div className="w-24 h-1.5 bg-indigo-600 mx-auto rounded-full"></div>
        </header>

        <div className="relative z-10 space-y-12">
          <section className="bg-white/5 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
            <h3 className="text-indigo-400 font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
              <i className="fa-solid fa-lightbulb"></i> Description of Solution
            </h3>
            <div className="space-y-4 text-slate-300 leading-relaxed text-sm md:text-base">
              <p>
                UniHub is a <strong className="text-white">Privacy-Focused Academic Assistant</strong>. By combining <strong className="text-indigo-400">Google Gemini 3 Flash</strong> with a <strong className="text-blue-400">Local-First Architecture</strong>, it provides a powerful, secure experience for students without any cloud dependency.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                  <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-shield-halved text-indigo-500"></i> Zero Server Storage
                  </h4>
                  <p className="text-xs text-slate-400">Your PDFs, WhatsApp chats, and notices stay on your device. Only the specific context needed for your question is sent to the AI.</p>
                </div>
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                  <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-clock text-emerald-500"></i> Local Efficiency
                  </h4>
                  <p className="text-xs text-slate-400">Manage attendance, SGPA, and assignments with zero cloud latency. Immediate feedback, always available offline.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-8 backdrop-blur-sm">
              <h3 className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                <i className="fa-brands fa-google"></i> Google Technologies Used
              </h3>
              <ul className="space-y-6">
                {googleTech.map((tech, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-blue-400 flex-shrink-0">
                      <i className={`fa-solid ${tech.icon}`}></i>
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">{tech.name}</h4>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">{tech.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-3xl p-8 backdrop-blur-sm">
              <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                <i className="fa-solid fa-brain"></i> Google AI Tools Integrated
              </h3>
              <ul className="space-y-6">
                {aiTools.map((tool, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400 flex-shrink-0">
                      <i className={`fa-solid ${tool.icon}`}></i>
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">{tool.name}</h4>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">{tool.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pitch;