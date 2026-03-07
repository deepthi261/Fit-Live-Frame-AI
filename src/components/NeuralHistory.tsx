import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Activity, Zap, BarChart2, Trash2 } from 'lucide-react';
import { sheetsClient } from '../lib/sheetsClient';

interface NeuralHistoryProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NeuralHistory: React.FC<NeuralHistoryProps> = ({ isOpen, onClose }) => {
    const history = sheetsClient.getWeeklyHistory();
    const averages = sheetsClient.getDailyAverages();

    const clearHistory = () => {
        if (confirm("Delete all neural history? This cannot be undone.")) {
            localStorage.setItem('neural_history', '[]');
            localStorage.setItem('daily_session_count', '0');
            window.location.reload();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 sm:p-12">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-4xl max-h-[80vh] bg-[#161b22] border border-white/5 rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* 🌟 HEADER */}
                        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#00f3ff]/10 rounded-2xl border border-[#00f3ff]/20">
                                    <BarChart2 className="w-6 h-6 text-[#00f3ff]" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">Neural History Vault</h2>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold italic">Cross-Session Intensity Analysis</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-4 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* 📊 AGGREGATES */}
                        <div className="grid grid-cols-2 gap-4 p-10 bg-black/20">
                            <div className="glass-panel p-6 border-white/5">
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 italic">Avg Intensity</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black italic text-[#00f3ff]">{averages.reps}</span>
                                    <span className="text-xs font-black text-gray-400">REPS / SESSION</span>
                                </div>
                            </div>
                            <div className="glass-panel p-6 border-white/5">
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 italic">Avg Burn Rate</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black italic text-[#00f3ff]">{averages.kcal}</span>
                                    <span className="text-xs font-black text-gray-400">KCAL / SESSION</span>
                                </div>
                            </div>
                        </div>

                        {/* 📜 LIST */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-4 custom-scrollbar">
                            {history.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center text-gray-600 gap-4 grayscale opacity-20">
                                    <Activity className="w-20 h-20" />
                                    <p className="text-xs font-black uppercase tracking-[0.4em]">No Neural Records Found</p>
                                </div>
                            ) : (
                                history.map((session: any, i: number) => (
                                    <motion.div
                                        key={session.id || i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group p-6 bg-white/[0.02] border border-white/5 rounded-[24px] hover:border-[#00f3ff]/20 hover:bg-white/[0.04] transition-all flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-[#00f3ff]/10 transition-colors">
                                                <Calendar className="w-5 h-5 text-gray-500 group-hover:text-[#00f3ff]" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-white italic tracking-tighter uppercase">{session.exercise}</span>
                                                    <span className="px-2 py-0.5 bg-white/5 rounded border border-white/10 text-[8px] font-black text-gray-500 uppercase">{session.timestamp.split(' ')[0]}</span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-1 opacity-60">
                                                    <div className="flex items-center gap-1.5">
                                                        <Activity className="w-3 h-3 text-[#00f3ff]" />
                                                        <span className="text-[10px] font-bold text-gray-400">{session.reps} Reps</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Zap className="w-3 h-3 text-yellow-500" />
                                                        <span className="text-[10px] font-bold text-gray-400">{session.calories} Kcal</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Session Precision</p>
                                            <p className="text-xl font-black italic text-[#00f3ff] leading-none">{(session.precision * 100).toFixed(0)}%</p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* 🗑️ FOOTER */}
                        <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-between items-center text-gray-500">
                            <p className="text-[9px] font-bold uppercase tracking-widest italic">{history.length} Sessions Cataloged</p>
                            <button
                                onClick={clearHistory}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all text-[9px] font-black uppercase tracking-widest italic"
                            >
                                <Trash2 className="w-4 h-4" /> Clear Vault
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
