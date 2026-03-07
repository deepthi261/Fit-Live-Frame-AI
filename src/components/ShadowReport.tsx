import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Brain, Zap, Heart, User, CloudUpload, CheckCircle, HardDrive, Download } from 'lucide-react';
import { gcsClient } from '../lib/cloudStorageClient';

interface ShadowReportProps {
    data: {
        reps: number;
        time: string;
        precision: number;
        calories: number;
        exercise: string;
        diet: string;
        gender: 'male' | 'female';
        engine: string;
        frameCount: number;
        nodes: number;
        keypoints?: Record<string, [number, number]>;
        screenshot?: string;
        mediaBlob?: Blob | File;
        dailySessionCount?: number;
        timestamp?: string;
    };
    onRestart: () => void;
}

export const ShadowReport: React.FC<ShadowReportProps> = ({ data, onRestart }) => {
    const [syncStatus, setSyncStatus] = useState<{ gcs: boolean, sheets: boolean, media: boolean, syncing: boolean }>({
        gcs: false,
        sheets: false,
        media: false,
        syncing: false
    });
    const [mediaProgress, setMediaProgress] = useState<number>(0);
    const score = Math.round(data.precision * 100);
    const dateStr = data.timestamp ? data.timestamp.split(' ').slice(0, 3).join(' ') : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = data.timestamp ? data.timestamp.split(' ').slice(3).join(' ') : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const sessionNum = data.dailySessionCount || 1;

    useEffect(() => {
        const performSync = async () => {
            setSyncStatus(prev => ({ ...prev, syncing: true }));
            const results = await gcsClient.syncSession({
                ...data,
                sessionNum,
                timestamp: data.timestamp || `${dateStr} ${timeStr}`
            }, data.mediaBlob, (p) => {
                setMediaProgress(p);
                if (p === 100) setSyncStatus(prev => ({ ...prev, media: true }));
            });
            setSyncStatus(prev => ({
                ...prev,
                gcs: results.gcs,
                sheets: results.sheets,
                syncing: false
            }));
        };

        performSync();
    }, []);

    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="w-screen h-screen bg-[#0d1117] flex items-center justify-center p-4 lg:p-6 overflow-hidden selection:bg-[#00f3ff]/20 text-white font-sans antialiased">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full h-full max-w-5xl bg-[#161b22] rounded-[40px] border border-white/10 shadow-2xl overflow-hidden relative flex flex-col"
            >
                {/* 🔝 HEADER */}
                <div className="w-full px-10 py-8 flex items-center justify-between border-b border-white/5 bg-white/[0.01]">
                    <div className={`flex flex-col gap-1 min-w-[180px]`}>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 text-[8px] font-black uppercase tracking-widest italic transition-all ${syncStatus.gcs && syncStatus.sheets ? (syncStatus.media ? 'text-[#00f3ff] bg-[#00f3ff]/5 border-[#00f3ff]/20' : 'text-yellow-400 bg-yellow-400/5') :
                            syncStatus.syncing ? 'text-yellow-400 animate-pulse transition-all' : 'text-gray-600'
                            }`}>
                            {syncStatus.syncing ? <CloudUpload className="w-3 h-3 animate-bounce" /> : (syncStatus.media ? <CheckCircle className="w-3 h-3 text-[#00f3ff]" /> : <CheckCircle className="w-3 h-3" />)}
                            {syncStatus.syncing ? 'Syncing Stats...' :
                                (syncStatus.gcs && syncStatus.sheets) ?
                                    (syncStatus.media ? 'Neural Vault Secured' : `Media Vaulting: ${mediaProgress}%`) :
                                    syncStatus.gcs ? 'GCS Archive Locked' :
                                        syncStatus.sheets ? 'Sheets Linked' : 'Local Vault Only'}
                        </div>
                        {mediaProgress > 0 && mediaProgress < 100 && (
                            <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${mediaProgress}%` }}
                                    className="h-full bg-[#00f3ff] shadow-[0_0_8px_#00f3ff]"
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <h1 className="text-lg font-bold tracking-[0.2em] uppercase text-white/90 italic">Shadow Report Summary</h1>
                        <p className="text-[10px] font-medium tracking-widest text-gray-500 mt-1 uppercase">Workout Complete | SESSION {sessionNum}</p>
                    </div>
                    <User className="w-5 h-5 text-gray-500" />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12 space-y-10">
                    {/* Timestamp Center */}
                    <div className="flex justify-center">
                        <span className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {dateStr.toUpperCase()} | {timeStr}
                        </span>
                    </div>

                    {/* 📊 CORE ANALYSIS SECTION */}
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* LEFT: PROGRESS CORE */}
                        <div className="flex flex-col items-center justify-center relative py-6">
                            <div className="relative flex items-center justify-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                    className="relative flex items-center justify-center"
                                >
                                    <svg className="w-64 h-64 -rotate-90">
                                        <circle
                                            cx="128" cy="128" r={radius}
                                            stroke="currentColor" strokeWidth="12" fill="transparent"
                                            className="text-white/[0.03]"
                                        />
                                        <motion.circle
                                            cx="128" cy="128" r={radius}
                                            stroke="currentColor" strokeWidth="12"
                                            strokeDasharray={circumference}
                                            initial={{ strokeDashoffset: circumference }}
                                            animate={{ strokeDashoffset: offset }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            strokeLinecap="round" fill="transparent"
                                            className="text-[#00f3ff] drop-shadow-[0_0_20px_rgba(0,243,255,0.5)]"
                                        />
                                    </svg>
                                </motion.div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                                    <span className="text-4xl font-black italic tracking-tighter text-white drop-shadow-lg leading-none">
                                        {score}%
                                    </span>
                                    <div className="mt-2 flex flex-col items-center">
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] italic">Avg Precision</span>
                                        <span className="text-sm font-black text-[#00f3ff] uppercase tracking-widest italic mt-0.5">PRO LEVEL</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: VITAL CARD */}
                        <div className="flex flex-col justify-center gap-6 h-full">
                            <div className="p-10 bg-gradient-to-br from-white/[0.03] to-transparent rounded-[40px] border border-white/5 flex items-center gap-8 group hover:border-[#00f3ff]/20 transition-all shadow-xl">
                                <div className="w-20 h-20 rounded-[24px] bg-[#00f3ff]/10 flex items-center justify-center border border-[#00f3ff]/20 shadow-inner">
                                    <Zap className="w-10 h-10 text-[#00f3ff] drop-shadow-[0_0_8px_rgba(0,243,255,0.4)]" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest leading-none">Total Energy Output</p>
                                    <div className="flex items-baseline gap-3">
                                        <h3 className="text-5xl font-black italic tracking-tighter text-white leading-none">{data.calories}</h3>
                                        <span className="text-xl font-black text-[#00f3ff] uppercase not-italic leading-none">Kcal</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400/40 uppercase tracking-widest pt-2 italic">Session Expenditure Audit</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 🍏 SHADOW INSIGHTS (Full Width) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-10 bg-gradient-to-br from-white/[0.03] to-[#00f3ff]/[0.02] rounded-[48px] border border-white/5 relative group overflow-hidden shadow-inner w-full"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-opacity">
                            <Brain className="w-16 h-16 text-[#00f3ff]" />
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-1 h-8 bg-gradient-to-b from-[#00f3ff] to-transparent rounded-full shadow-[0_0_15px_#00f3ff]" />
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.5em] italic">Shadow Insight: Nutritional Protocol</h3>
                        </div>
                        <div className="space-y-4">
                            <p className="text-xl text-gray-300 italic font-medium leading-tight tracking-tight">
                                "{data.diet || "Prioritize high-absorption metabolic repair items immediately to stabilize CNS."}"
                            </p>
                        </div>
                    </motion.div>

                    {/* 🕒 CONSOLIDATED STATS BAR (Full Width, Below Nutrition) */}
                    <div className="grid grid-cols-3 gap-1 bg-white/[0.02] border border-white/5 rounded-[48px] overflow-hidden backdrop-blur-md shadow-2xl">
                        <div className="p-10 flex flex-col items-center gap-3 border-r border-white/5 group hover:bg-white/[0.02] transition-colors">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic leading-none">Duration</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black italic text-white leading-none">{data.time}</span>
                                <span className="text-xs font-black text-[#00f3ff] uppercase not-italic leading-none">Min</span>
                            </div>
                        </div>
                        <div className="p-10 flex flex-col items-center gap-3 border-r border-white/5 group hover:bg-white/[0.02] transition-colors">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic leading-none">Movement</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black italic text-white leading-none">{data.reps}</span>
                                <span className="text-xs font-black text-[#00f3ff] uppercase not-italic leading-none">Reps</span>
                            </div>
                        </div>
                        <div className="p-10 flex flex-col items-center gap-3 group hover:bg-white/[0.02] transition-colors">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic leading-none">Vitals</p>
                            <div className="flex items-center gap-3">
                                <Heart className="w-6 h-6 text-red-500 fill-red-500/20 animate-pulse" />
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black italic text-white leading-none">162</span>
                                    <span className="text-xs font-black text-[#00f3ff] uppercase not-italic leading-none">Bpm</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🏁 BOTTOM ACTION BAR */}
                <div className="p-10 border-t border-white/5 bg-white/[0.015] flex flex-col items-center gap-6">
                    {data.mediaBlob && (
                        <div className="flex flex-col items-center gap-4 w-full">
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic opacity-60">Manual Drive Integration Required</div>
                            <button
                                onClick={() => {
                                    const url = URL.createObjectURL(data.mediaBlob!);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    const ext = data.mediaBlob!.type.includes('webm') ? 'webm' : (data.mediaBlob!.type.includes('quicktime') ? 'mov' : 'mp4');
                                    a.download = `Session-${sessionNum}_Archive.${ext}`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                }}
                                className="w-full max-w-sm py-4 rounded-[24px] bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.2em] italic text-xs flex items-center justify-center gap-4 hover:bg-white/10 transition-all group"
                            >
                                <HardDrive className="w-4 h-4 text-[#00f3ff] group-hover:scale-110 transition-transform" />
                                Save to Drive (Manual Link)
                                <Download className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    )}

                    <button
                        onClick={onRestart}
                        className="w-full max-w-sm py-8 rounded-[32px] bg-[#00f3ff] text-black font-black uppercase tracking-[0.4em] italic text-base flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_50px_rgba(0,243,255,0.4)] outline-none"
                    >
                        NEW SESSION <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
