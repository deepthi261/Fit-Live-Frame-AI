import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clipboard, User, Target, Zap, MessageSquare, Send, X } from 'lucide-react';

interface SessionReviewProps {
    data: any;
    onCancel: () => void;
    onSubmit: (finalData: any) => void;
}

export const SessionReview: React.FC<SessionReviewProps> = ({ data, onCancel, onSubmit }) => {
    const [editedData, setEditedData] = useState({
        reps: data.reps || 0,
        exercise: data.exercise || "General Training",
        diet: data.diet || "Prioritize high-absorption metabolic repair.",
        gender: data.gender || "male"
    });

    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-2xl bg-[#0d1117] rounded-[40px] border border-white/10 shadow-[0_0_100px_rgba(0,243,255,0.1)] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-[#00f3ff]/10 border border-[#00f3ff]/20">
                            <Clipboard className="w-6 h-6 text-[#00f3ff]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">Neural Data Entry</h2>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5 italic">Verify & Refine Session Logs</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Identification Section */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#00f3ff] italic ml-1">
                                <User className="w-3 h-3" /> Gender Identity
                            </label>
                            <select
                                value={editedData.gender}
                                onChange={(e) => setEditedData({ ...editedData, gender: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-black italic tracking-tight outline-none focus:border-[#00f3ff]/40 transition-all appearance-none uppercase"
                            >
                                <option value="male">MALE_PRO</option>
                                <option value="female">FEMALE_ELITE</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#00f3ff] italic ml-1">
                                <Target className="w-3 h-3" /> Rep Count
                            </label>
                            <input
                                type="number"
                                value={editedData.reps}
                                onChange={(e) => setEditedData({ ...editedData, reps: parseInt(e.target.value) || 0 })}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-black italic tracking-tight outline-none focus:border-[#00f3ff]/40 transition-all text-center text-xl"
                            />
                        </div>
                    </div>

                    {/* Exercise Pred */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#00f3ff] italic ml-1">
                            <Zap className="w-3 h-3" /> Movement Classification
                        </label>
                        <input
                            type="text"
                            value={editedData.exercise}
                            onChange={(e) => setEditedData({ ...editedData, exercise: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-black italic tracking-tight outline-none focus:border-[#00f3ff]/40 transition-all uppercase"
                            placeholder="EXERCISE NAME..."
                        />
                    </div>

                    {/* Insights Feedback */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#00f3ff] italic ml-1">
                            <MessageSquare className="w-3 h-3" /> Dietary Feedback Insight
                        </label>
                        <textarea
                            value={editedData.diet}
                            onChange={(e) => setEditedData({ ...editedData, diet: e.target.value })}
                            rows={3}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-gray-300 font-medium italic outline-none focus:border-[#00f3ff]/40 transition-all resize-none text-sm"
                        />
                    </div>

                    {/* Meta Readout */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5 italic">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Archive Date</span>
                            <span className="text-xs font-bold text-white uppercase">{dateStr}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Entry Time</span>
                            <span className="text-xs font-bold text-white uppercase">{timeStr}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Session ID</span>
                            <span className="text-xs font-bold text-white uppercase">#{data.dailySessionCount || '001'}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Submit */}
                <div className="p-8 border-t border-white/5 bg-white/[0.015]">
                    <button
                        onClick={() => onSubmit({ ...data, ...editedData })}
                        className="w-full py-6 rounded-3xl bg-[#00f3ff] text-black font-black uppercase tracking-[0.5em] italic text-sm flex items-center justify-center gap-4 hover:scale-[1.01] active:scale-95 transition-all shadow-[0_0_40px_rgba(0,243,255,0.3)]"
                    >
                        LOCK IN NEURAL LOGS <Send className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
