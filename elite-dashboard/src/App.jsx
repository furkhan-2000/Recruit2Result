import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  MapPin, 
  BrainCircuit, 
  Activity, 
  LayoutDashboard,
  ShieldCheck,
  Zap
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("command");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const pipelineStages = [
    { id: "sourced", label: "Sourced", count: 12, color: "blue" },
    { id: "vetted", label: "AI Vetted", count: 8, color: "purple" },
    { id: "outreach", label: "Outreach", count: 5, color: "yellow" },
    { id: "interview", label: "Interview", count: 2, color: "green" },
  ];

  const [candidates, setCandidates] = useState([
    { id: 1, name: "Sarah Chen", role: "Senior AI Engineer", stage: "vetted", score: 96 },
    { id: 2, name: "Marcus Thorne", role: "Fullstack Lead", stage: "sourced", score: 89 },
    { id: 3, name: "Elena Rodriguez", role: "CTO", stage: "outreach", score: 92 },
    { id: 4, name: "David Kim", role: "ML Specialist", stage: "interview", score: 94 },
    { id: 5, name: "James Wilson", role: "DevOps Architect", stage: "vetted", score: 88 },
  ]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      document.documentElement.style.setProperty('--x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-elite-bg text-white selection:bg-elite-accent/30 overflow-hidden">
      <div className="cursor-glow" />
      
      {/* Premium Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-20 lg:w-64 glass-card border-r border-white/5 z-50 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-elite-accent rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            <Zap size={24} className="text-white fill-white" />
          </div>
          <span className="hidden lg:block font-black text-xl tracking-tighter uppercase">Recruit2Result</span>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Recruit Command" 
            active={activeTab === "command"} 
            onClick={() => setActiveTab("command")}
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="Pipeline View" 
            active={activeTab === "pipeline"} 
            onClick={() => setActiveTab("pipeline")}
          />
          <NavItem icon={<BrainCircuit size={20} />} label="AI Vetting" />
          <NavItem icon={<Activity size={20} />} label="System Health" />
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 glass-card rounded-xl">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <ShieldCheck size={16} className="text-green-500" />
            </div>
            <div className="hidden lg:block text-xs">
              <p className="font-semibold text-green-500">SECURE SAAS</p>
              <p className="text-white/40 italic text-[10px]">Built by Khan Mohammed</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Stage */}
      <main className="lg:ml-64 p-8 page-transition">
        {/* Header */}
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter mb-2">
              {activeTab === "command" ? "Recruit Command" : "Pipeline Intelligence"}
            </h1>
            <p className="text-white/40 font-medium italic">Autonomous AI recruitment engine for global talent sourcing.</p>
          </div>
          <div className="hidden lg:flex gap-4">
             <div className="text-right">
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Inference Speed</p>
                <p className="text-xl font-mono text-elite-accent font-bold">142ms</p>
             </div>
             <div className="text-right border-l border-white/10 pl-4">
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Token Efficiency</p>
                <p className="text-xl font-mono text-elite-accent font-bold">84%</p>
             </div>
          </div>
        </header>

        {activeTab === "command" ? (
          <>
            {/* Command Interface */}
            <div className="mb-12 glass-card p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-elite-accent/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-elite-accent/10 transition-all duration-500" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                    <Search className="text-elite-accent" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Executive Search Prompt</h2>
                    <p className="text-xs text-white/40">Trigger autonomous scrapers across 4 global networks.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="e.g., Senior AI Engineer in San Francisco with Groq/LLM experience..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-elite-accent/50 transition-all font-medium"
                  />
                  <button className="px-8 py-4 bg-elite-accent hover:bg-blue-600 rounded-2xl font-bold text-sm tracking-widest uppercase shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all active:scale-95">
                    Launch Swarm
                  </button>
                </div>
              </div>
            </div>

            {/* Hero Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <LeadCard 
                title="Senior AI Engineer" 
                company="NeuralPath Systems" 
                score={96} 
                reason="Exact match for gpt-oss-120b expertise."
              />
              <LeadCard 
                title="Fullstack Lead" 
                company="CloudScale AI" 
                score={89} 
                reason="Strong Node.js background; lacks OCI experience."
              />
              <LeadCard 
                title="CTO" 
                company="VentureFlow" 
                score={92} 
                reason="Previous experience in microservice scaling."
              />
            </div>

            {/* Activity Console */}
            <section className="glass-card rounded-2xl overflow-hidden border border-white/5">
              <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-elite-accent rounded-full animate-pulse" />
                  Live Executive Stream
                </h3>
                <span className="text-xs text-white/30 font-mono">service-talent-sourcing-v1</span>
              </div>
              <div className="p-6 h-64 font-mono text-xs space-y-2 overflow-y-auto custom-scrollbar">
                 <p className="text-elite-accent">[06:12:04] Initializing stealth executive agent...</p>
                 <p className="text-elite-accent">[06:12:05] NodeMaven rotation #14 successful (US-RES)</p>
                 <p className="text-white/40">[06:12:08] Scanning executive portals: [postedWithin: 24h]</p>
                 <p className="text-elite-accent">[06:12:12] AI Fit-Analysis started for Executive #442...</p>
                 <p className="text-green-500">[06:12:14] Elite Fit Found! Score: 96% - "Senior AI Engineer"</p>
                 <p className="text-white/40">[06:12:15] Pivot to Executive Suite: Found "Sarah Chen" (VP Talent)</p>
                 <p className="text-elite-accent">[06:12:16] Delivering lead to K8S secure layer...</p>
              </div>
            </section>
          </>
        ) : (
          /* Pipeline View Content */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-250px)]">
            {pipelineStages.map(stage => (
              <div key={stage.id} className="flex flex-col h-full bg-white/5 rounded-3xl border border-white/5 p-4">
                <div className="flex justify-between items-center mb-6 px-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full bg-${stage.color}-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]`} />
                    {stage.label}
                  </h3>
                  <span className="text-[10px] font-mono text-white/30 bg-white/5 px-2 py-1 rounded-md">{stage.count}</span>
                </div>
                
                <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                  {candidates.filter(c => c.stage === stage.id).map(candidate => (
                    <div key={candidate.id} className="glass-card p-4 rounded-2xl border border-white/10 hover:border-elite-accent/50 transition-all cursor-move group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-white/80 group-hover:text-white">{candidate.name}</span>
                        <span className="text-[10px] font-mono text-elite-accent">{candidate.score}%</span>
                      </div>
                      <p className="text-[10px] text-white/40 mb-3">{candidate.role}</p>
                      <div className="flex gap-2">
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-elite-accent" style={{ width: `${candidate.score}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {candidates.filter(c => c.stage === stage.id).length === 0 && (
                    <div className="h-32 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center">
                      <p className="text-[10px] text-white/20 uppercase font-bold">Empty Stack</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer ${active ? 'bg-elite-accent text-white shadow-[0_0_20px_rgba(37,99,235,0.2)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
    >
      {icon}
      <span className="hidden lg:block font-medium text-sm">{label}</span>
    </div>
  );
}

function LeadCard({ title, company, score, reason }) {
  return (
    <div className="glass-card p-6 rounded-2xl relative group">
      <div className="absolute top-0 right-0 p-6">
        <div className="text-2xl font-black text-elite-accent mono">{score}%</div>
        <div className="text-[10px] text-white/30 uppercase font-bold text-right">Fit</div>
      </div>
      <h4 className="text-lg font-bold mb-1 pr-16">{title}</h4>
      <p className="text-white/40 text-sm mb-4">{company}</p>
      
      <div className="bg-white/5 p-3 rounded-xl border border-white/5 mb-4">
        <p className="text-[10px] text-elite-accent font-bold uppercase mb-1 flex items-center gap-1">
          <BrainCircuit size={10} /> Executive Vetting
        </p>
        <p className="text-xs text-white/70 italic leading-relaxed">"{reason}"</p>
      </div>

      <button className="w-full py-2 bg-white/5 hover:bg-elite-accent hover:text-white border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all">
        Pivot to CEO Contact
      </button>
    </div>
  );
}
