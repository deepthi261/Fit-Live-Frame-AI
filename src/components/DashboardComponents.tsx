import React from 'react';
import { motion } from 'framer-motion';

/**
 * Circular Progress for Reps (12/15 style)
 */
export function RepTracker({ current }: { current: number }) {
    return (
        <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Pulsing Decorative Ring */}
            <div className="absolute w-24 h-24 rounded-full border-4 border-white/5" />
            <motion.div
                className="absolute w-24 h-24 rounded-full border-4 border-neon-cyan/20"
                animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="absolute flex flex-col items-center">
                <span className="text-5xl font-black text-white italic tracking-tighter leading-none">
                    {current}
                </span>
                <span className="text-[8px] font-black text-[#00f3ff] uppercase tracking-[0.3em] mt-2 opacity-60">
                    Total Reps
                </span>
            </div>
        </div>
    );
}

/**
 * Frequency Bar Chart for Precision
 */
export function PrecisionChart({ precision }: { precision: number }) {
    return (
        <div className="flex items-end gap-1.5 h-12">
            {[...Array(10)].map((_, i) => (
                <motion.div
                    key={i}
                    className="w-2 rounded-full bg-neon-cyan"
                    initial={{ height: 4 }}
                    animate={{
                        height: i * 10 < precision ? Math.max(10, Math.random() * 40 + i * 4) : 4,
                        opacity: i * 10 < precision ? 1 : 0.2
                    }}
                    transition={{ duration: 0.3 }}
                    style={{ boxShadow: i * 10 < precision ? '0 0 10px rgba(0, 242, 255, 0.4)' : 'none' }}
                />
            ))}
        </div>
    );
}

/**
 * Real-time Form Analysis Line Graph (Sparkline)
 */
export function FormGraph({ data }: { data: number[] }) {
    const points = data.map((d, i) => `${(i / (data.length - 1)) * 200},${100 - (d / 100) * 80}`).join(' ');

    return (
        <div className="w-full h-32 relative group">
            <svg viewBox="0 0 200 100" className="w-full h-full preserve-3d">
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#00f2ff" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#00f2ff" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path
                    d={`M 0 100 L ${points} L 200 100 Z`}
                    fill="url(#gradient)"
                    className="transition-all duration-500"
                />
                <motion.polyline
                    points={points}
                    fill="none"
                    stroke="#00f2ff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    className="neon-shadow-strong"
                />
            </svg>
        </div>
    );
}

/**
 * Compact Metric Card (Set, Time, Heart Rate)
 */
export function MetricCard({ label, value, unit, icon }: { label: string; value: string; unit?: string; icon?: React.ReactNode }) {
    return (
        <div className="glass-panel p-4 flex flex-col justify-between border-white/5 hover:border-white/10 transition-colors">
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic">{label}</span>
                <div className="opacity-20">{icon}</div>
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white italic tracking-tighter">{value}</span>
                {unit && <span className="text-[10px] font-bold text-neon-cyan uppercase tracking-widest">{unit}</span>}
            </div>
        </div>
    );
}
