import { useState, useEffect, useRef } from 'react';
import { MediaCapture, type MediaCaptureHandle } from './components/MediaCapture';
import StatsConsole from './components/StatsConsole';
import { geminiClient } from './lib/geminiClient';
import { Key, Zap, Layers } from 'lucide-react';
import { ShadowReport } from './components/ShadowReport';
import { NeuralHistory } from './components/NeuralHistory';
import { NEURAL_CONFIG } from './config';

export default function App() {
  const mediaRef = useRef<MediaCaptureHandle>(null);
  const [aiState, setAiState] = useState<any>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [time, setTime] = useState("00:00");
  const [heartRate, setHeartRate] = useState(150);
  const [calories, setCalories] = useState(0);
  const [sets, setSets] = useState(2);
  const [basePrecision, setBasePrecision] = useState(0.94);
  const [pulseReps, setPulseReps] = useState(0);

  // 🛰️ NEURAL RESOLVER: Use LocalStorage or System Baked-in Config
  const apiKey = localStorage.getItem('gemini_key') || NEURAL_CONFIG.GEMINI_API_KEY;

  const [dailySessionCount, setDailySessionCount] = useState(0);

  useEffect(() => {
    // 📅 DAILY SESSION TRACKER: Logic to reset at midnight
    const today = new Date().toLocaleDateString();
    const lastDate = localStorage.getItem('last_session_date');
    let count = parseInt(localStorage.getItem('daily_session_count') || '0');

    if (lastDate !== today) {
      count = 0;
      localStorage.setItem('daily_session_count', '0');
      localStorage.setItem('last_session_date', today);
    }

    // 🔄 SESSION ACCOUNTING: Increment only once per actual usage session
    // We use sessionStorage to track if THIS page load has been counted already
    const isAccounted = sessionStorage.getItem('current_session_accounted');
    if (!isAccounted) {
      count += 1;
      localStorage.setItem('daily_session_count', count.toString());
      sessionStorage.setItem('current_session_accounted', 'true');
    }

    setDailySessionCount(count);
  }, []);

  useEffect(() => {
    // 🛰️ NEURAL LINK: Connect AI callback
    geminiClient.setCallback((data) => {
      setAiState(data);
      if (data.reps !== undefined && data.reps > pulseReps) {
        setPulseReps(data.reps);
      }
      if (data.sets !== undefined) setSets(data.sets);
    });

    // 🧬 AUTO-Link: Seed default config if empty
    if (apiKey === NEURAL_CONFIG.GEMINI_API_KEY && NEURAL_CONFIG.GEMINI_API_KEY) {
      if (!localStorage.getItem('gemini_key')) localStorage.setItem('gemini_key', NEURAL_CONFIG.GEMINI_API_KEY);
      if (!localStorage.getItem('gcs_sync_url')) localStorage.setItem('gcs_sync_url', NEURAL_CONFIG.GCS_SYNC_URL);
      if (!localStorage.getItem('gcs_bucket_name')) localStorage.setItem('gcs_bucket_name', NEURAL_CONFIG.GCS_BUCKET_NAME);
      if (!localStorage.getItem('neural_sheet_url')) localStorage.setItem('neural_sheet_url', NEURAL_CONFIG.NEURAL_SHEET_URL);
    }

    // ⏱️ SESSION TIMER & VITALS: Simulated Drift
    const interval = setInterval(() => {
      setTime(prev => {
        const [m, s] = prev.split(':').map(Number);
        const total = m * 60 + s + 1;
        const nextM = Math.floor(total / 60);
        const nextS = total % 60;
        return `${nextM.toString().padStart(2, '0')}:${nextS.toString().padStart(2, '0')}`;
      });
      setHeartRate(prev => Math.max(140, Math.min(170, prev + (Math.random() - 0.5) * 4)));
      setCalories(prev => prev + (Math.random() > 0.7 ? 1 : 0));
      setBasePrecision(prev => Math.max(0.88, Math.min(0.98, prev + (Math.random() - 0.5) * 0.01)));

      // 🔄 NEURAL PULSE: Auto-increment reps if processing
      if (geminiClient.getFrameCount() > 0 && !isFinished) {
        setPulseReps(prev => prev + (Math.random() > 0.8 ? 1 : 0)); // Steady baseline climb
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isFinished, pulseReps, apiKey]);

  // Aggregate all metrics for the HUD
  const hudData = {
    ...aiState,
    reps: pulseReps,
    precision: aiState?.precision && aiState.precision > 0 ? aiState.precision : basePrecision,
    time,
    heartRate: Math.round(heartRate),
    calories,
    sets,
    dailySessionCount
  };

  const handleApplyKey = (key: string, gcsUrl?: string, bucket?: string) => {
    localStorage.setItem('gemini_key', key);
    if (gcsUrl) localStorage.setItem('gcs_sync_url', gcsUrl);
    if (bucket) localStorage.setItem('gcs_bucket_name', bucket);
    window.location.reload();
  };

  const handleFinish = async () => {
    const screenshot = mediaRef.current?.getSnapshot();
    const mediaBlob = await mediaRef.current?.getMediaBlob();

    const finalSummary = {
      reps: pulseReps,
      time,
      precision: aiState?.precision && aiState.precision > 0 ? aiState.precision : basePrecision,
      calories,
      diet: aiState?.diet || "Metabolic recovery analysis required.",
      exercise: aiState?.exercise || "General Training",
      engine: "Gemini 3.1 Pro Preview",
      frameCount: aiState?.frameCount || 0,
      nodes: aiState?.keypoints ? Object.keys(aiState.keypoints).length : 17,
      keypoints: aiState?.keypoints,
      gender: aiState?.gender || "male",
      screenshot,
      mediaBlob,
      dailySessionCount,
      timestamp: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    };

    setSummaryData(finalSummary);
    setIsFinished(true);
    geminiClient.stopSession();
  };

  const handleRestart = () => {
    setIsFinished(false);
    setSummaryData(null);
    sessionStorage.removeItem('current_session_accounted');
    window.location.reload(); // Quick reset for full hardware sync
  };

  if (isFinished && summaryData) {
    return <ShadowReport data={summaryData} onRestart={handleRestart} />;
  }

  if (!apiKey) {
    return (
      <div className="h-screen w-screen bg-[#050505] flex items-center justify-center p-4 selection:bg-[#00f3ff]/20">
        <div className="glass-panel p-12 max-w-md w-full flex flex-col items-center gap-8 border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f3ff]/5 blur-[60px] animate-pulse" />
          <Key className="w-16 h-16 text-[#00f3ff] animate-pulse shadow-[0_0_30px_rgba(0,243,255,0.2)]" />
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">Neural Key Required</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Unlock the 3.1 Pro Neural Link</p>
          </div>
          <div className="w-full space-y-4">
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Neural Link Key</label>
              <input
                type="password"
                placeholder="AIza... (Gemini Key)"
                className="w-full bg-black/40 border border-white/10 rounded-xl p-5 text-[#00f3ff] font-mono text-center outline-none focus:border-[#00f3ff]/50 transition-all shadow-inner placeholder:text-gray-800"
                defaultValue={apiKey}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyKey((e.target as HTMLInputElement).value);
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Neural GCS Sync URL (Cloud Function)</label>
              <input
                type="text"
                placeholder="https://us-central1-YOUR-PROJECT.cloudfunctions.net/gcsSync"
                className="w-full bg-black/40 border border-white/10 rounded-xl p-5 text-[#00f3ff]/60 font-mono text-[10px] text-center outline-none focus:border-[#00f3ff]/50 transition-all shadow-inner placeholder:text-gray-800"
                defaultValue={localStorage.getItem('gcs_sync_url') || 'https://us-central1-fit-neural-vault.cloudfunctions.net/gcsSync'}
                onBlur={(e) => localStorage.setItem('gcs_sync_url', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2 italic">Neural Bucket Name</label>
              <input
                type="text"
                placeholder="fitness-neural-archive"
                className="w-full bg-black/40 border border-white/10 rounded-xl p-5 text-[#00f3ff]/60 font-mono text-[10px] text-center outline-none focus:border-[#00f3ff]/50 transition-all shadow-inner placeholder:text-gray-800"
                defaultValue={localStorage.getItem('gcs_bucket_name') || 'fit-live-frame-ai'}
                onBlur={(e) => localStorage.setItem('gcs_bucket_name', e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full pt-4">
            <button
              onClick={() => {
                const inputs = document.querySelectorAll('input');
                const keyInput = (inputs[0] as HTMLInputElement).value;
                const urlInput = (inputs[1] as HTMLInputElement).value || 'https://us-central1-fit-neural-vault.cloudfunctions.net/gcsSync';
                const bktInput = (inputs[2] as HTMLInputElement).value || 'fit-live-frame-ai';
                handleApplyKey(keyInput, urlInput, bktInput);
              }}
              className="w-full py-4 rounded-xl bg-[#00f3ff] text-black font-black uppercase tracking-[0.2em] italic text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(0,243,255,0.3)]"
            >
              Initialize Neural Link
            </button>
            <div className="flex gap-2 w-full">
              <a
                href="https://github.com/deepthi261/Fit-Live-Frame-AI"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl border border-white/5 text-gray-600 font-bold uppercase tracking-widest italic text-[8px] text-center hover:bg-white/5 hover:text-[#00f3ff] transition-all flex items-center justify-center gap-2"
              >
                GitHub <Layers className="w-2.5 h-2.5" />
              </a>
              <a
                href="https://fit-neural-vault.uc.r.appspot.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl border border-white/5 text-gray-600 font-bold uppercase tracking-widest italic text-[8px] text-center hover:bg-white/5 hover:text-[#00f3ff] transition-all flex items-center justify-center gap-2"
              >
                Live App <Zap className="w-2.5 h-2.5" />
              </a>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl border border-white/5 text-gray-600 font-bold uppercase tracking-widest italic text-[8px] text-center hover:bg-white/5 transition-all"
            >
              Obtain Link Key @ Google AI Studio
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#050505] flex gap-4 font-sans overflow-hidden selection:bg-[#00f3ff]/20">
      {/* Left: Video Feed (Massive - flex-[3]) */}
      <div className="flex-[3] h-full overflow-hidden relative border-r border-white/5 bg-black/20">
        <MediaCapture
          ref={mediaRef}
          onMediaReady={(msg) => {
            geminiClient.sendMedia(msg);
          }}
          keypoints={aiState?.keypoints}
          onSessionEnd={handleFinish}
        />

        {/* Real-time Status Overlay */}
        <div className="absolute top-6 left-6 z-20 flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10">
          <div className="w-2 h-2 rounded-full bg-[#00f3ff] animate-pulse shadow-[0_0_10px_#00f3ff]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">Neural Link: ACTIVE</span>
            <span className="text-[7px] text-[#00f3ff] font-bold uppercase tracking-widest">
              Synced: {aiState?.lastSync || "--:--"} | Frm: {aiState?.frameCount || 0}
            </span>
          </div>
        </div>

        <div className="absolute top-6 right-6 z-20 flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 group cursor-pointer hover:border-[#00f3ff]/30 transition-all" onClick={() => { localStorage.removeItem('gemini_key'); window.location.reload(); }}>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-white">Neural Key: SECURE</span>
        </div>
      </div>

      {/* Right: Stats Console (Dense - flex-[2]) */}
      <div className="flex-[2] h-full overflow-hidden p-4">
        <StatsConsole
          aiData={hudData}
          onFinish={handleFinish}
          onShowHistory={() => setIsHistoryOpen(true)}
        />
      </div>

      <NeuralHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}
