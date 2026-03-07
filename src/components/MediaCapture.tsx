import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Camera, Upload, RefreshCw, X, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { geminiClient } from '../lib/geminiClient';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface MediaCaptureHandle {
    getSnapshot: () => string | undefined;
    getMediaBlob: () => Promise<Blob | File | undefined>;
}

interface MediaCaptureProps {
    onMediaReady: (media: string) => void;
    className?: string;
    keypoints?: Record<string, [number, number]>;
    onSessionEnd?: (finalFrame?: string) => void;
}

export const MediaCapture = forwardRef<MediaCaptureHandle, MediaCaptureProps>(({
    onMediaReady,
    className,
    keypoints,
    onSessionEnd
}, ref) => {
    const [mode, setMode] = useState<'camera' | 'upload' | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Recording Logic
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const [capturedFile, setCapturedFile] = useState<File | null>(null);

    useImperativeHandle(ref, () => ({
        getSnapshot: () => {
            if (canvasRef.current) {
                return canvasRef.current.toDataURL('image/jpeg', 0.8);
            }
            return undefined;
        },
        getMediaBlob: async () => {
            if (capturedFile) return capturedFile;

            // Wait for final chunks if still recording
            if (recorderRef.current && recorderRef.current.state === 'recording') {
                return new Promise((resolve) => {
                    recorderRef.current!.onstop = () => {
                        resolve(new Blob(chunksRef.current, { type: 'video/webm' }));
                    };
                    recorderRef.current!.stop();
                });
            }

            if (chunksRef.current.length > 0) {
                return new Blob(chunksRef.current, { type: 'video/webm' });
            }
            return undefined;
        }
    }));

    // Effect for Camera Mode
    useEffect(() => {
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            if (mode === 'camera') {
                setIsLoading(true);
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { width: 1280, height: 720 },
                        audio: false
                    });

                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        await videoRef.current.play();
                        setIsStreaming(true);

                        // Start Recording
                        chunksRef.current = [];
                        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
                        recorder.ondataavailable = (e) => {
                            if (e.data.size > 0) chunksRef.current.push(e.data);
                        };
                        recorder.start(1000); // 1s chunks
                        recorderRef.current = recorder;
                    }
                } catch (err) {
                    console.error("Camera Error:", err);
                    setMode(null);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(t => t.stop());
            }
            if (recorderRef.current && recorderRef.current.state !== 'inactive') {
                recorderRef.current.stop();
            }
            setIsStreaming(false);
        };
    }, [mode]);

    // Effect for Upload Playback and Trigger
    useEffect(() => {
        if (mode === 'upload' && videoRef.current && previewUrl) {
            videoRef.current.load();
            videoRef.current.play().then(() => {
                setIsStreaming(true); // Treat file playback as a stream for frame analysis
            }).catch(e => console.log("Video playback inhibited:", e));
        }
    }, [previewUrl, mode]);

    // Analysis Circuit Breaker: Replacement for stacked setInterval
    useEffect(() => {
        let isMounted = true;

        const runAnalysis = async () => {
            if (!isMounted || !isStreaming || !mode || document.visibilityState !== 'visible') {
                if (isMounted) setTimeout(runAnalysis, 3000); // Check again in 3s if still backgrounded
                return;
            }

            const video = videoRef.current;
            const canvas = canvasRef.current;

            if (video && canvas && video.readyState >= 2 && video.videoWidth > 0 && !video.paused && !video.ended) {
                // Prepare frame at 480p (640w) for TPM Efficiency
                const MAX_WIDTH = 640;
                let targetWidth = video.videoWidth;
                let targetHeight = video.videoHeight;

                if (targetWidth > MAX_WIDTH) {
                    const scale = MAX_WIDTH / targetWidth;
                    targetWidth = Math.floor(targetWidth * scale);
                    targetHeight = Math.floor(targetHeight * scale);
                }

                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
                    const frame = canvas.toDataURL('image/jpeg', 0.7);

                    // AWAIT: Ensure we wait for the AI and its 3s cooldown before scheduling next
                    await geminiClient.processFrame(frame);
                }
            }

            // Scheduling Logic: ONLY run if the tab is actually visible to the user
            if (isMounted) {
                // DYNAMIC QUOTA: Files can be scanned faster (5s) than live streams (15s/30s)
                let nextDelay = document.visibilityState === 'visible' ? 15000 : 30000;

                if (mode === 'upload' && document.visibilityState === 'visible') {
                    nextDelay = 5000; // 5s gap for uploaded archives to identify acts faster
                }

                setTimeout(runAnalysis, nextDelay);
            }
        };

        if (isStreaming && mode) {
            runAnalysis();
        }

        return () => { isMounted = false; };
    }, [isStreaming, mode]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('video/')) {
            const url = URL.createObjectURL(file);
            setMode('upload');
            setPreviewUrl(url);
            setCapturedFile(file);
            // We no longer send the raw File for large uploads to avoid connection errors
            // Instead, we let the Frame Capture System "scan" the video as it plays
            onMediaReady(`[META] CCTV Archive Load: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        }
    };

    const reset = () => {
        let finalFrame = undefined;
        if (canvasRef.current && videoRef.current) {
            finalFrame = canvasRef.current.toDataURL('image/jpeg', 0.8);
        }

        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
            recorderRef.current.stop();
        }

        if (onSessionEnd) onSessionEnd(finalFrame);

        setMode(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setCapturedFile(null);
        setIsStreaming(false);
        setIsLoading(false);
    };

    const NeuralNodeLayer = () => {
        if (!keypoints || !isStreaming) return null;

        // Support for both legacy flat keypoints and new structured landmarks
        const nodes: Record<string, { x: number, y: number, visibility?: number }> =
            (keypoints as any).landmarks || keypoints;

        // Define MediaPipe Pose Connections (Limbs)
        const connections = [
            ['left_shoulder', 'right_shoulder'],
            ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
            ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
            ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
            ['left_hip', 'right_hip'],
            ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
            ['right_hip', 'right_knee'], ['right_knee', 'right_ankle'],
            ['left_ankle', 'left_heel'], ['left_ankle', 'left_foot_index'],
            ['right_ankle', 'right_heel'], ['right_ankle', 'right_foot_index']
        ];

        const getCoord = (name: string) => {
            const point = nodes[name];
            if (!point) return null;
            // Handle both array [y, x] and object {x, y}
            if (Array.isArray(point)) return { x: point[1] / 10, y: point[0] / 10 };
            return { x: point.x * 100, y: point.y * 100 };
        };

        return (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
                {/* Draw Connections (Skeleton Lines) */}
                {connections.map(([a, b], i) => {
                    const p1 = getCoord(a);
                    const p2 = getCoord(b);
                    if (!p1 || !p2) return null;
                    return (
                        <motion.line
                            key={`line-${i}`}
                            x1={`${p1.x}%`} y1={`${p1.y}%`}
                            x2={`${p2.x}%`} y2={`${p2.y}%`}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.4 }}
                            className="stroke-neon-cyan stroke-[2]"
                        />
                    );
                })}

                {/* Draw Nodes */}
                {Object.entries(nodes).map(([name, point]) => {
                    const coord = getCoord(name);
                    if (!coord) return null;
                    const visibility = (point as any).visibility ?? 1;
                    if (visibility < 0.3) return null; // Filter occluded nodes

                    return (
                        <g key={name}>
                            <motion.circle
                                cx={`${coord.x}%`}
                                cy={`${coord.y}%`}
                                r="4"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="fill-neon-cyan shadow-[0_0_10px_#00f2ff]"
                            />
                            {/* Only show labels for major joints to reduce clutter */}
                            {['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'nose'].includes(name) && (
                                <text
                                    x={`${coord.x}%`}
                                    y={`${coord.y - 1.5}%`}
                                    className="fill-white text-[8px] font-black uppercase italic tracking-widest text-center"
                                    style={{ textShadow: '0 0 5px #00f2ff' }}
                                >
                                    {name.replace(/_/g, ' ')}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        );
    };

    return (
        <div className={cn("relative w-full h-full glass-panel overflow-hidden group border-2 border-white/5 bg-[#050505]", className)}>
            <canvas ref={canvasRef} className="hidden" />

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="video/*"
                onChange={handleFileUpload}
            />

            {!mode ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8 bg-premium-glow z-50">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-3xl bg-neon-cyan/5 border border-neon-cyan/10 flex items-center justify-center mb-2">
                            <Shield className="w-8 h-8 text-neon-cyan fill-neon-cyan/20" />
                        </div>
                        <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Neural Link Initialization</h3>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] opacity-60 text-center px-8">
                            Sync Live Cameras, CCTV Feeds, or Athlete Performance Archives
                        </p>
                    </div>

                    <div className="flex gap-6">
                        <button
                            onClick={() => setMode('camera')}
                            className="flex flex-col items-center p-10 glass-panel hover:bg-neon-cyan/10 transition-all border-white/5 hover:border-neon-cyan/40 group/btn bg-white/[0.02]"
                        >
                            <Camera className="w-16 h-16 text-neon-cyan mb-4 group-hover/btn:scale-110 transition-transform" />
                            <span className="font-black uppercase italic tracking-widest text-[10px]">Neural Live Cam</span>
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center p-10 glass-panel hover:bg-neon-cyan/10 transition-all border-white/5 hover:border-neon-cyan/40 group/btn bg-white/[0.02]"
                        >
                            <Upload className="w-16 h-16 text-neon-cyan mb-4 group-hover/btn:scale-110 transition-transform" />
                            <span className="font-black uppercase italic tracking-widest text-[10px]">Sync Performance Archive</span>
                            <span className="text-[7px] font-black uppercase tracking-widest text-white/40 mt-1 italic">Direct API Analysis</span>
                        </button>
                    </div>
                    <div className="text-neon-cyan/40 text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <Shield className="w-3 h-3" /> Standard Gym Knowledge V10 Active
                    </div>
                </div>
            ) : (
                <div className="relative w-full h-full bg-black">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-40">
                            <div className="flex flex-col items-center gap-4">
                                <RefreshCw className="w-12 h-12 text-neon-cyan animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-neon-cyan">Deep Scanning Sequence...</span>
                            </div>
                        </div>
                    )}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        src={previewUrl || undefined}
                        onEnded={() => {
                            if (mode === 'upload' && onSessionEnd) onSessionEnd();
                        }}
                        className="absolute inset-0 w-full h-full object-cover opacity-90"
                    />

                    <NeuralNodeLayer />

                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                        {/* Immersive Neural Mesh Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00f2ff]/5 to-transparent h-64 w-full animate-[scan_4s_linear_infinite] top-[-10rem] opacity-30" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20" />

                    <div className="absolute top-6 right-6 flex gap-2 z-30">
                        <button
                            onClick={reset}
                            className="p-4 glass-panel hover:bg-red-500/20 text-red-400 transition-all border-white/5 group/close"
                        >
                            <X className="w-6 h-6 group-hover/close:rotate-90 transition-transform" />
                        </button>
                    </div>

                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-8 px-10 py-5 glass-panel backdrop-blur-2xl border-white/10 z-30">
                        <div className="flex items-center gap-4">
                            <div className={cn("w-3 h-3 rounded-full shadow-[0_0_15px_#ef4444]", isStreaming ? "bg-red-500 animate-pulse" : "bg-gray-700")} />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white italic">
                                    {mode === 'camera' ? '3D CCTV LIVE SYNC' : '3D ARCHIVE SCANNING'}
                                </span>
                                <span className="text-[7px] font-black uppercase tracking-widest text-neon-cyan opacity-40 italic">3D Spatial Movement Active</span>
                            </div>
                        </div>
                        <div className="w-[1px] h-8 bg-white/10" />
                        <button onClick={reset} className="text-white/40 hover:text-neon-cyan transition-all transform hover:rotate-180">
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});
