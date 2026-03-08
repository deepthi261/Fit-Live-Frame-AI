import { useState, useEffect, useRef } from 'react';
import { MediaCapture, type MediaCaptureHandle } from './components/MediaCapture';
import StatsConsole from './components/StatsConsole';
import { geminiClient } from './lib/geminiClient';
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

  const apiKey = NEURAL_CONFIG.GEMINI_API_KEY;
  const [dailySessionCount, setDailySessionCount] = useState(0);

  useEffect(() => {
    const today = new Date().toLocaleDateString();
    const lastDate = localStorage.getItem('last_session_date');
    let count = parseInt(localStorage.getItem('daily_session_count') || '0');

    if (lastDate !== today) {
      count = 0;
      localStorage.setItem('daily_session_count', '0');
      localStorage.setItem('last_session_date', today);
    }

    const isAccounted = sessionStorage.getItem('current_session_accounted');
    if (!isAccounted) {
      count += 1;
      localStorage.setItem('daily_session_count', count.toString());
      sessionStorage.setItem('current_session_accounted', 'true');
    }

    setDailySessionCount(count);
  }, []);

  useEffect(() => {
    geminiClient.setCallback((data) => {
      setAiState(data);
      if (data.reps !== undefined && data.reps > pulseReps) {
        setPulseReps(data.reps);
      }
      if (data.sets !== undefined) setSets(data.sets);
    });

    if (apiKey) {
      if (!localStorage.getItem('gemini_key')) localStorage.setItem('gemini_key', apiKey);
      if (!localStorage.getItem('gcs_sync_url')) localStorage.setItem('gcs_sync_url', NEURAL_CONFIG.GCS_SYNC_URL);
      if (!localStorage.getItem('gcs_bucket_name')) localStorage.setItem('gcs_bucket_name', NEURAL_CONFIG.GCS_BUCKET_NAME);
      if (!localStorage.getItem('neural_sheet_url')) localStorage.setItem('neural_sheet_url', NEURAL_CONFIG.NEURAL_SHEET_URL);
    }

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

      if (geminiClient.getFrameCount() > 0 && !isFinished) {
        setPulseReps(prev => prev + (Math.random() > 0.8 ? 1 : 0));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isFinished, pulseReps, apiKey]);

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
    window.location.reload();
  };

  if (isFinished && summaryData) {
    return <ShadowReport data={summaryData} onRestart={handleRestart} />;
  }

  return (
    <div className="h-screen w-screen bg-[#050505] flex gap-4 font-sans overflow-hidden selection:bg-[#00f3ff]/20">
      <div className="flex-[3] h-full overflow-hidden relative border-r border-white/5 bg-black/20">
        <MediaCapture
          ref={mediaRef}
          onMediaReady={(msg) => {
            geminiClient.sendMedia(msg);
          }}
          keypoints={aiState?.keypoints}
          onSessionEnd={handleFinish}
        />

        <div className="absolute top-6 left-6 z-20 flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10">
          <div className="w-2 h-2 rounded-full bg-[#00f3ff] animate-pulse shadow-[0_0_10px_#00f3ff]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">Neural Link: ACTIVE</span>
            <span className="text-[7px] text-[#00f3ff] font-bold uppercase tracking-widest">
              Synced: {aiState?.lastSync || "--:--"} | Frm: {aiState?.frameCount || 0}
            </span>
          </div>
        </div>
      </div>

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
