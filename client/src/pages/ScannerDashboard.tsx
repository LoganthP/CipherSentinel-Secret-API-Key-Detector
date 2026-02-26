import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api';

export default function ScannerDashboard() {
    const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
    const [isHovering, setIsHovering] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [text, setText] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsHovering(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsHovering(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsHovering(false);
    }, []);

    const triggerScan = async () => {
        setIsScanning(true);
        setScanProgress(0);

        // Simulate progress bar incrementing
        const interval = setInterval(() => {
            setScanProgress(p => {
                if (p >= 95) return 95;
                return p + Math.floor(Math.random() * 10);
            });
        }, 300);

        try {
            let response;
            if (activeTab === 'upload' && file) {
                const formData = new FormData();
                formData.append('file', file);
                response = await fetch(`${API_BASE}/scan/file`, {
                    method: 'POST',
                    body: formData,
                });
            } else if (activeTab === 'paste' && text) {
                response = await fetch(`${API_BASE}/scan/text`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, fileName: 'Pasted Snippet' }),
                });
            }

            const data = await response?.json();
            clearInterval(interval);
            setScanProgress(100);

            if (data && data.scanId) {
                setTimeout(() => {
                    setIsScanning(false);
                    navigate(`/scan/${data.scanId}`);
                }, 800);
            }
        } catch (error) {
            console.error('Scan failed:', error);
            clearInterval(interval);
            setIsScanning(false);
            setScanProgress(0);
            alert('Scanning failed. Is the server running?');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full min-h-[70vh] relative">
            {!isScanning ? (
                <div className="w-full max-w-2xl">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl tracking-tight font-bold mb-2">Initialize Security Scan</h2>
                        <p className="text-slate-400">Deploy heuristics to detect embedded vulnerabilities</p>
                    </div>

                    <div className="glass-card rounded-xl overflow-hidden shadow-2xl border border-primary/20">
                        {/* Tabs */}
                        <div className="flex border-b border-primary/20 bg-background-dark/50">
                            <button
                                onClick={() => setActiveTab('upload')}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold tracking-wide transition-all ${activeTab === 'upload' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                            >
                                <span className="material-symbols-outlined text-xl">upload_file</span> FILE UPLOAD
                            </button>
                            <button
                                onClick={() => setActiveTab('paste')}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold tracking-wide transition-all ${activeTab === 'paste' ? 'bg-secondary/10 text-secondary border-b-2 border-secondary' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                            >
                                <span className="material-symbols-outlined text-xl">code</span> CODE SNIPPET
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="p-8 min-h-[350px] flex flex-col justify-center">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full h-full"
                                >
                                    {activeTab === 'upload' ? (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            onDrop={handleDrop}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            className={`h-56 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${isHovering ? 'border-primary bg-primary/5' : 'border-slate-700 hover:border-slate-500 bg-black/20'} ${file ? 'border-secondary bg-secondary/5' : ''}`}
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileInput}
                                                className="hidden"
                                                accept=".env,.js,.json,.txt,.pem"
                                            />
                                            {file ? (
                                                <div className="text-center text-secondary flex flex-col items-center">
                                                    <span className="material-symbols-outlined text-5xl mb-2 animate-pulse">verified</span>
                                                    <span className="font-mono text-sm">TARGET ACQUIRED: {file.name}</span>
                                                </div>
                                            ) : (
                                                <div className="text-center text-slate-400 group flex flex-col items-center">
                                                    <span className={`material-symbols-outlined text-5xl mb-3 transition-colors ${isHovering ? 'text-primary' : 'group-hover:text-slate-300'}`}>cloud_upload</span>
                                                    <span className="font-bold tracking-widest text-sm mb-1 uppercase">Drag & Drop Secure Files</span>
                                                    <span className="text-xs text-slate-500">Supports .env, .js, .json, .txt, .pem</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="h-56 relative group border border-slate-700 rounded-xl overflow-hidden focus-within:border-primary transition-colors">
                                            <div className="absolute top-0 w-full bg-slate-900 border-b border-slate-800 px-4 py-2 flex gap-2 z-10">
                                                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                            </div>
                                            <textarea
                                                value={text}
                                                onChange={(e) => setText(e.target.value)}
                                                placeholder="// Paste suspected vulnerable code here..."
                                                className="w-full h-full bg-slate-950 text-green-400 font-mono text-sm p-4 pt-12 resize-none outline-none overflow-y-auto"
                                                spellCheck={false}
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={triggerScan}
                            disabled={(activeTab === 'upload' && !file) || (activeTab === 'paste' && !text)}
                            className={`flex items-center gap-2 px-10 py-4 font-bold tracking-widest rounded-xl transition-all uppercase ${(activeTab === 'upload' && !file) || (activeTab === 'paste' && !text)
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                : 'bg-primary/20 border-2 border-primary text-primary hover:bg-primary/30 neon-glow-purple'
                                }`}
                        >
                            <span className="material-symbols-outlined">radar</span>
                            Execute Scan
                        </button>
                    </div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="w-full max-w-md flex flex-col items-center relative py-10"
                >
                    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-12">
                        <div className="absolute inset-0 border-2 border-primary/30 rounded-full" />
                        <div className="absolute inset-4 border border-secondary/20 rounded-full" />
                        <div className="absolute inset-0 overflow-hidden rounded-full">
                            <div className="scan-line" />
                        </div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-32 h-32 md:w-40 md:h-40 bg-primary/10 rounded-full flex items-center justify-center neon-glow-purple border border-primary/50">
                                <span className="material-symbols-outlined text-7xl text-secondary animate-pulse-fast">security</span>
                            </div>
                        </div>
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-background-dark px-3 py-1 border border-primary/50 rounded-full text-[10px] uppercase tracking-widest text-primary font-bold whitespace-nowrap">
                            System Core Active
                        </div>
                    </div>

                    <div className="w-full text-center mb-8">
                        <div className="flex justify-between items-end mb-2 px-1">
                            <span className="text-secondary font-bold text-sm">SCANNING THREATS</span>
                            <span className="text-2xl font-bold text-primary tracking-tighter">{scanProgress}%</span>
                        </div>
                        <div className="h-3 w-full bg-primary/10 rounded-full overflow-hidden border border-primary/20 p-[2px]">
                            <motion.div
                                className="h-full bg-primary rounded-full shadow-[0_0_12px_rgba(166,13,242,0.8)] animate-pulse-fast"
                                initial={{ width: 0 }}
                                animate={{ width: `${scanProgress}%` }}
                                transition={{ ease: "linear" }}
                            />
                        </div>
                        <p className="mt-4 text-slate-400 text-sm italic">Analyzing cryptographic entropy in selected target...</p>
                    </div>

                    <div className="w-full max-w-xl mb-8">
                        <div className="bg-black/80 rounded-lg border border-primary/30 p-4 font-mono text-xs md:text-sm text-green-400/90 shadow-2xl backdrop-blur-sm h-40 overflow-hidden relative">
                            <div className="absolute top-2 right-4 flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                                <div className="w-2 h-2 rounded-full bg-green-500/50" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-primary/70">[$] Initializing CipherSentinel Kernel v4.2.0...</p>
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>[ok] Connection to secure node established.</motion.p>
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>[*] Checking for hardcoded API keys...</motion.p>
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>[*] Analyzing repository encryption standards...</motion.p>
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.0 }} className="flex items-center gap-2">
                                    <span className="inline-block w-2 h-4 bg-secondary animate-pulse" />
                                    <span>Entropy check {scanProgress}% in progress...</span>
                                </motion.p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setIsScanning(false);
                            setScanProgress(0);
                        }}
                        className="w-full max-w-xs py-4 bg-transparent border-2 border-red-500/50 hover:border-red-500 hover:bg-red-500/10 text-red-500 font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group uppercase tracking-widest text-sm"
                    >
                        <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">cancel</span>
                        Abort Scan
                    </button>
                </motion.div>
            )}
        </div>
    );
}
