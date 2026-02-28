import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { NeuCard, NeuBackground, NeuButton } from "@/components/LiquidGlass";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { 
  ChevronLeft, Share2, Download, Trophy, AlertTriangle, 
  Play, Pause, Wand2, FileText, Mic, Eye, CheckCircle2
} from "lucide-react";
import html2pdf from "html2pdf.js";
import { toast } from "sonner";

// Dummy data for the Confidence Area Chart
const confidenceData = [
  { time: "0m", value: 65 }, { time: "2m", value: 70 }, { time: "4m", value: 70 },
  { time: "6m", value: 45 }, { time: "8m", value: 65 }, { time: "10m", value: 85 },
  { time: "12m", value: 85 }, { time: "14m", value: 75 }, { time: "16m", value: 88 },
  { time: "20m", value: 85 }, { time: "24m", value: 95 }, { time: "30m", value: 88 }
];

export default function Report() {
  const { sessionId } = useParams();
  const location = useLocation();
  const [sessionData, setSessionData] = useState<{role: string, content: string}[]>([]);

  useEffect(() => {
    const data = location.state?.sessionData;
    if (data && data.length > 0) {
      setSessionData(data);
    } else {
      const stored = localStorage.getItem('lastInterviewSession');
      if (stored) {
        setSessionData(JSON.parse(stored));
      }
    }
  }, [location]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "HireMind Performance Report",
          text: "Check out this AI-generated interview performance report from HireMind!",
          url: shareUrl,
        });
      } catch (err) {
        console.error("Error sharing report:", err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Report link copied to clipboard!");
    }
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById("report-content");
    if (!element) return;
    
    toast.info("Generating PDF report...");
    
    const opt = {
      margin:       0.2,
      filename:     `Performance-Report-${sessionId || "session"}.pdf`,
      image:        { type: "jpeg" as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: "in", format: "letter" as const, orientation: "portrait" as const }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
      toast.success("PDF downloaded successfully!");
    });
  };

  return (
    <div className="min-h-screen bg-[#e0e5ec] text-slate-800 p-4 md:p-8 lg:p-12 relative overflow-hidden font-sans selection:bg-blue-500/30">
      <NeuBackground />
      
      <div id="report-content" className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link to="/dashboard" data-html2canvas-ignore="true" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-3">
              <ChevronLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Senior Product Manager • Google (Panel Round) • Oct 24, 2026
            </p>
            <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">Performance Report</h1>
          </div>
          
          <div className="flex items-center gap-4" data-html2canvas-ignore="true">
            <button onClick={handleShare} className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#e8ecf1] text-[15px] font-bold text-slate-700 shadow-[3px_3px_6px_rgba(163,177,198,0.4),-3px_-3px_6px_rgba(255,255,255,0.8)] border border-white/50 hover:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] transition-all">
              <Share2 strokeWidth={2.5} className="w-4 h-4" /> Share
            </button>
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#e8ecf1] via-[#d0dbf6] to-[#8eb0f7] text-[15px] font-bold text-slate-800 shadow-[3px_3px_6px_rgba(163,177,198,0.4),-3px_-3px_6px_rgba(255,255,255,0.8)] border border-white/40 hover:opacity-90 transition-all">
              <Download strokeWidth={2.5} className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </header>

        {/* Top Section: Score & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Overall Score Card */}
          <NeuCard className="lg:col-span-1 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden bg-[#e0e5ec]">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest w-full text-left mb-6">Overall Score</h3>
            
            <div className="relative w-40 h-40 flex items-center justify-center mb-8">
              {/* Fake SVG Circle Progress */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-300" />
                <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="440" strokeDashoffset="66" className="text-blue-500 transition-all duration-1000 ease-out" />
              </svg>
              <div className="flex flex-col items-center justify-center z-10 bg-[#0f172e] rounded-full w-[120px] h-[120px] shadow-lg">
                <span className="text-5xl font-black text-white">85</span>
                <span className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
                  ↗ +12% vs last
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 w-full gap-2">
              <div className="neu-flat p-3 rounded-xl flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 mb-1">Content</span>
                <span className="text-lg font-black text-slate-800">92/100</span>
              </div>
              <div className="neu-flat p-3 rounded-xl flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 mb-1">Delivery</span>
                <span className="text-lg font-black text-slate-800">78/100</span>
              </div>
              <div className="neu-flat p-3 rounded-xl flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 mb-1">EQ</span>
                <span className="text-lg font-black text-slate-800">85/100</span>
              </div>
            </div>
            
            <Trophy className="absolute -bottom-6 -right-6 w-40 h-40 text-blue-500 opacity-[0.05]" />
          </NeuCard>

          {/* Confidence Analysis Chart */}
          <NeuCard className="lg:col-span-2 p-6 flex flex-col bg-[#e0e5ec]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Confidence Analysis</h3>
                <p className="text-sm font-medium text-slate-500">AI-detected vocal stability and phrasing confidence.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 bg-red-100 text-red-600 border border-red-200 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Stress
                </span>
                <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> High Impact
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={confidenceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorConfidence)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </NeuCard>

        </div>

        {/* Live Interview Transcript Section */}
        <NeuCard className="p-6 md:p-8 mb-8 bg-[#e0e5ec]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <span className="p-2 neu-pressed rounded-xl">
                 <FileText size={20} className="text-blue-600" />
              </span> 
              Live Interview Transcript
            </h2>
            <span className="text-sm font-bold text-slate-500 bg-white/50 px-3 py-1 rounded-full border border-slate-200">
              {sessionData.length} Messages Recorded
            </span>
          </div>

          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar rounded-xl p-2">
            {sessionData.length > 0 ? sessionData.map((msg: any, idx: number) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-5 border shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-emerald-50 border-emerald-200 neu-pressed' 
                    : 'bg-white border-blue-100'
                }`}>
                  <p className={`text-[10px] font-bold mb-2 uppercase tracking-widest flex items-center gap-1.5 ${
                    msg.role === 'user' ? 'text-emerald-600' : 'text-blue-600'
                  }`}>
                    {msg.role === 'user' ? (
                       <><Mic size={12} /> You</>
                    ) : (
                       <><Wand2 size={12} /> AI Panelist</>
                    )}
                  </p>
                  <p className="text-[15px] font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                 <FileText size={48} className="mb-4 opacity-20" />
                 <p className="italic font-medium">No recorded interview transcript found for this session.</p>
              </div>
            )}
          </div>
        </NeuCard>

        {/* Metric Breakdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NeuCard className="p-6 bg-[#e0e5ec]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg neu-pressed flex items-center justify-center text-blue-600"><FileText size={16} /></div>
              <h3 className="font-bold text-slate-800">Content Quality</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1"><span>Keyword Usage</span> <span className="text-slate-800">Excellent</span></div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-blue-500 w-[90%]" /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1"><span>Structure (STAR)</span> <span className="text-slate-800">Good</span></div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-blue-400 w-[75%]" /></div>
              </div>
            </div>

            <ul className="text-xs text-slate-600 space-y-2 font-medium">
              <li className="flex gap-2 items-start"><span className="text-blue-500 mt-1">•</span> Strong usage of industry jargon.</li>
              <li className="flex gap-2 items-start"><span className="text-blue-500 mt-1">•</span> Missed quantifiable metrics in Q2.</li>
            </ul>
          </NeuCard>

          <NeuCard className="p-6 bg-[#e0e5ec]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg neu-pressed flex items-center justify-center text-purple-600"><Mic size={16} /></div>
              <h3 className="font-bold text-slate-800">Vocal Delivery</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1"><span>Pacing (WPM)</span> <span className="text-slate-800">145 - Ideal</span></div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-purple-500 w-[85%]" /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1"><span>Filler Words</span> <span className="text-slate-800">Moderate</span></div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-yellow-400 w-[60%]" /></div>
              </div>
            </div>

            <ul className="text-xs text-slate-600 space-y-2 font-medium">
              <li className="flex gap-2 items-start"><span className="text-purple-500 mt-1">•</span> 12 "Ums" detected.</li>
              <li className="flex gap-2 items-start"><span className="text-purple-500 mt-1">•</span> Great volume modulation.</li>
            </ul>
          </NeuCard>

          <NeuCard className="p-6 bg-[#e0e5ec]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg neu-pressed flex items-center justify-center text-emerald-600"><Eye size={16} /></div>
              <h3 className="font-bold text-slate-800">Non-Verbal Cues</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1"><span>Eye Contact</span> <span className="text-slate-800">Strong</span></div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-emerald-500 w-[95%]" /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1"><span>Posture</span> <span className="text-slate-800">Needs Work</span></div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-orange-400 w-[40%]" /></div>
              </div>
            </div>

            <ul className="text-xs text-slate-600 space-y-2 font-medium">
              <li className="flex gap-2 items-start"><span className="text-emerald-500 mt-1">•</span> Maintained focus on camera.</li>
              <li className="flex gap-2 items-start"><span className="text-orange-500 mt-1">•</span> Frequent touching of face/hair.</li>
            </ul>
          </NeuCard>
        </div>

      </div>
    </div>
  );
}
