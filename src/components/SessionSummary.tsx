import { Award, Zap, MessageSquare, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface SessionSummaryProps {
    finalPrecision: number;
    totalCalories: number;
    exerciseType: string;
    onRestart: () => void;
}

export function SessionSummary({ finalPrecision, totalCalories, exerciseType, onRestart }: SessionSummaryProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-6"
        >
            <div className="glass-panel max-w-2xl w-full p-8 lg:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-neon-cyan/10 rounded-full blur-[100px] -mr-32 -mt-32" />

                <div className="text-center mb-12">
                    <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-2">Shadow Report</h2>
                    <p className="text-neon-cyan font-bold tracking-[0.3em] uppercase text-xs">Session Complete</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="glass-panel p-8 flex flex-col items-center text-center space-y-4">
                        <div className="w-24 h-24 rounded-full border-4 border-neon-cyan/20 flex items-center justify-center relative">
                            <div className="absolute inset-0 rounded-full border-4 border-neon-cyan border-t-transparent animate-spin-slow" />
                            <span className="text-4xl font-black text-white italic">{finalPrecision}%</span>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold uppercase text-gray-500 tracking-widest mb-1">Avg Precision</h4>
                            <p className="text-neon-cyan text-sm font-bold">PRO LEVEL</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="glass-panel p-6 flex items-center gap-6">
                            <div className="w-12 h-12 rounded-xl bg-neon-cyan/10 flex items-center justify-center">
                                <Zap className="text-neon-cyan w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Total Energy</h4>
                                <p className="text-2xl font-black text-white italic">{totalCalories} <span className="text-xs uppercase font-bold text-neon-cyan">kcal</span></p>
                            </div>
                        </div>

                        <div className="glass-panel p-6 flex items-center gap-6 border-neon-cyan/10">
                            <div className="w-12 h-12 rounded-xl bg-neon-cyan/5 flex items-center justify-center">
                                <Award className="text-neon-cyan w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Exercise Focus</h4>
                                    <span className="text-[9px] font-black text-neon-cyan uppercase tracking-widest italic">3D Spatial Score: 98%</span>
                                </div>
                                <p className="text-xl font-black text-white italic uppercase tracking-tight">{exerciseType}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-8 mb-12 bg-white/5">
                    <div className="flex items-center gap-4 mb-4">
                        <MessageSquare className="text-neon-cyan w-6 h-6" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-white">Shadow Insight</h3>
                    </div>
                    <p className="text-gray-400 italic leading-relaxed">
                        "Your form was highly consistent throughout the session. To reach the next level, focus on maintaining core stability during the deeper range of your squats."
                    </p>
                </div>

                <button
                    onClick={onRestart}
                    className="w-full bg-neon-cyan text-black font-black uppercase py-5 rounded-2xl hover:bg-white transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                    New Session <RefreshCw className="w-5 h-5" />
                </button>
            </div>
        </motion.div>
    );
}
