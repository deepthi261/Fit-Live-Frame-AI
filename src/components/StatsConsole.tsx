import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, MessageSquare, Activity, Clock, Heart, Layers, Settings, Send, BarChart2 } from 'lucide-react';
import { RepTracker, PrecisionChart, FormGraph, MetricCard } from './DashboardComponents';
import { gcsClient } from '../lib/cloudStorageClient';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface StatsConsoleProps {
    aiData: any;
    onFinish: () => void;
    onShowHistory: () => void;
}

export default function StatsConsole({ aiData, onFinish, onShowHistory }: StatsConsoleProps) {
    const reps = aiData?.reps || 0;
    const precision = aiData?.precision || 0;
    const exercise = aiData?.exercise || "Awaiting AI...";
    const voice = aiData?.voice || "Awaiting movement patterns.";
    const time = aiData?.time || "00:00";
    const hr = aiData?.heartRate || 156;
    const calories = aiData?.calories || 0;
    const dailyCount = aiData?.dailySessionCount || 1;
    const [showSettings, setShowSettings] = useState(false);
    const [sheetUrl, setSheetUrl] = useState(localStorage.getItem('neural_sheet_url') || '');

    // Mocking form history for the graph
    const formHistory = Array(12).fill(0).map((_) => 80 + Math.random() * 15);

    return (
        <div className="w-full h-full glass-panel rounded-2xl p-6 flex flex-col gap-4 overflow-y-auto scrollbar-hide border border-white/5 shadow-2xl relative select-none">
            {/* HUD Header */}
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter text-white leading-none uppercase">FIT LIVE FRAME AI</h1>
                    <p className="text-[10px] font-bold text-[#00f3ff] uppercase tracking-widest mt-1 opacity-60 italic">SHADOW MENTOR V3.0 | SESSION {dailyCount}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onShowHistory}
                        className="w-12 h-12 rounded-2xl bg-[#00f3ff]/10 border border-[#00f3ff]/20 flex items-center justify-center hover:bg-[#00f3ff]/20 transition-all group"
                        title="Neural History Vault"
                    >
                        <BarChart2 className="w-6 h-6 text-[#00f3ff] group-hover:scale-110 transition-transform" />
                    </button>
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-gray-500" />
                    </div>
                </div>
            </div>

            {/* Top Grid: Precision & Reps */}
            <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel p-5 space-y-3 border-white/5 relative overflow-hidden group h-40">
                    <div className="flex items-center gap-2 text-gray-500">
                        <h3 className="text-[10px] font-black uppercase tracking-widest italic">Precision</h3>
                        <Zap className="w-3 h-3 group-hover:text-[#00f3ff] transition-colors" />
                    </div>
                    <div className="relative">
                        <span className="text-5xl font-black text-white italic tracking-tighter">{Math.round(precision * 100)}%</span>
                        <div className="mt-4"><PrecisionChart precision={precision * 100} /></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00f3ff] animate-pulse" />
                        <p className="text-[#00f3ff] text-[9px] font-black uppercase italic tracking-widest leading-none">Neural Guard: ACTIVE</p>
                    </div>
                </div>

                <div className="glass-panel p-5 flex flex-col items-center justify-center border-white/5 group h-40">
                    <RepTracker current={reps} />
                </div>
            </div>

            {/* Mid Grid: Sets & Activity */}
            <div className="grid grid-cols-2 gap-4">
                <MetricCard label="Day Session" value={`${dailyCount}`} icon={<Layers className="w-4 h-4" />} />
                <div className="glass-panel p-4 border-white/5 flex flex-col justify-center min-h-24">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#00f3ff] italic">Predicted Activity</span>
                    <span className={cn(
                        "text-xl font-black text-white italic tracking-tight uppercase leading-none mt-1",
                        exercise === "READY" && "animate-pulse opacity-40"
                    )}>
                        {exercise}
                    </span>
                </div>
            </div>

            {/* Metrics Trio: Time, HR, Calories */}
            <div className="grid grid-cols-3 gap-4">
                <MetricCard label="T+Session" value={time} icon={<Clock className="w-3 h-3" />} />
                <MetricCard label="Vitals/HR" value={`${hr}`} unit="bpm" icon={<Heart className="w-3 h-3" />} />
                <MetricCard label="Burn/Rate" value={`${calories}`} unit="kcal" icon={<Zap className="w-3 h-3" />} />
            </div>

            {/* Daily Persistence Layer */}
            <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel p-4 border-[#00f3ff]/10 bg-[#00f3ff]/[0.02]">
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest italic leading-none mb-1">Total Reps Today</p>
                    <span className="text-lg font-black text-[#00f3ff] italic">{gcsClient.getDailyStats().reps + reps}</span>
                </div>
                <div className="glass-panel p-4 border-[#00f3ff]/10 bg-[#00f3ff]/[0.02]">
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest italic leading-none mb-1">Total Kcal Today</p>
                    <span className="text-lg font-black text-[#00f3ff] italic">{gcsClient.getDailyStats().kcal + calories}</span>
                </div>
            </div>

            {/* Bottom: 3D Spatial Form Map */}
            <div className="glass-panel p-6 space-y-6 border-white/5 flex flex-col bg-gradient-to-b from-transparent to-[#00f3ff]/5">
                <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[#00f3ff] italic">3D Spatial Form Map</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[7px] font-black text-gray-500 uppercase italic tracking-tighter">3D Spatial Intelligence Active</span>
                        <Settings
                            className={cn("w-4 h-4 transition-colors cursor-pointer", showSettings ? "text-[#00f3ff]" : "text-white/20 hover:text-[#00f3ff]")}
                            onClick={() => setShowSettings(!showSettings)}
                        />
                    </div>
                </div>

                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2 pb-2"
                    >
                        <label className="text-[8px] font-black text-[#00f3ff] uppercase tracking-widest italic ml-1">Neural Sheet Endpoint</label>
                        <input
                            type="text"
                            value={sheetUrl}
                            onChange={(e) => {
                                setSheetUrl(e.target.value);
                                localStorage.setItem('neural_sheet_url', e.target.value);
                            }}
                            placeholder="https://script.google.com/macros/s/..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[9px] text-white font-mono outline-none focus:border-[#00f3ff]/40 transition-all"
                        />
                        <p className="text-[7px] text-gray-600 uppercase italic font-bold tracking-widest leading-none">Paste your Google Apps Script URL here to sync logs to Sheets.</p>
                    </motion.div>
                )}

                <div className="h-24"><FormGraph data={formHistory} /></div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5">
                    <div className="space-y-1">
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] leading-none">3D Depth Acc.</span>
                        <span className="text-xs font-black text-[#00f3ff] italic block uppercase tracking-tighter">Optimal</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] leading-none">Spatial Symm.</span>
                        <span className="text-xs font-black text-white italic block uppercase tracking-tighter">Stable</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] leading-none">Knee Align</span>
                        <span className="text-xs font-black text-white italic block uppercase tracking-tighter">Stable</span>
                    </div>
                </div>
            </div>

            {/* AI Command Console */}
            <div className="bg-[#00f3ff]/5 border border-[#00f3ff]/10 p-4 rounded-xl mt-auto">
                <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-3 h-3 text-[#00f3ff]" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#00f3ff]/50">Neural Link Command</span>
                </div>
                <p className="text-[11px] leading-relaxed text-gray-400 font-medium italic border-l-2 border-[#00f3ff]/40 pl-4 py-1">
                    "{voice}"
                </p>
            </div>

            {/* Session Actions */}
            <div className="flex flex-col gap-2 mt-2">
                <button
                    onClick={onFinish}
                    className="w-full py-5 glass-panel border-[#00f3ff]/20 hover:border-[#00f3ff] hover:bg-[#00f3ff]/10 transition-all group flex items-center justify-center gap-3"
                >
                    <div className="w-2 h-2 rounded-full bg-[#00f3ff] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Finish Session & Submit</span>
                    <Send className="w-4 h-4 text-[#00f3ff] group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex gap-2">
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
            </div>
        </div>
    );
}
