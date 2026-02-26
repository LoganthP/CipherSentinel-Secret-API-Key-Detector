import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const API_BASE = 'http://localhost:5000/api';

interface SecretMatch {
    type: string;
    match: string;
    line: number;
    severity: 'Low' | 'Medium' | 'Critical';
}

interface ScanResult {
    scanId: string;
    fileName: string;
    secretsDetected: SecretMatch[];
    severity: 'Low' | 'Medium' | 'Critical';
    riskScore: number;
    createdAt: string;
}

interface AppSettings {
    security: {
        privacyMode: boolean;
        maskSecrets: boolean;
    };
}

export default function ResultsPage() {
    const { id } = useParams<{ id: string }>();
    const [result, setResult] = useState<ScanResult | null>(null);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [codeContent, setCodeContent] = useState<string>('// Loading target code...');

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const [resResponse, settingsResponse] = await Promise.all([
                    fetch(`${API_BASE}/scans/${id}`),
                    fetch(`${API_BASE}/settings`)
                ]);

                const data = await resResponse.json();
                const settingsData = await settingsResponse.json();

                setResult(data);
                setSettings(settingsData);

                if (data && data.secretsDetected) {
                    const shouldMask = settingsData?.security?.maskSecrets;
                    const mask = (val: string) => shouldMask ? "****************" : val;

                    let mockCode = '// Decrypted source code representation\n// Target: ' + data.fileName + '\n\n';
                    data.secretsDetected.forEach((d: SecretMatch) => {
                        mockCode += `Line ${d.line}: ${mask(d.match)} // [${d.type}] - ${d.severity} Risk\n`;
                    });
                    if (data.secretsDetected.length === 0) {
                        mockCode += '// No heuristic signatures detected.\n// Systems secure.\n';
                    }
                    setCodeContent(mockCode);
                }
            } catch (error) {
                console.error('Failed to fetch scan results', error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchResult();
    }, [id]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
            <div className="text-primary font-mono animate-pulse">DECRYPTING RESULTS...</div>
        </div>
    );

    if (!result) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <span className="material-symbols-outlined text-threat text-5xl">error</span>
            <div className="text-threat font-mono">SCAN NOT FOUND [404]</div>
            <Link to="/scan" className="text-primary hover:underline">Return to Command Center</Link>
        </div>
    );

    const isClear = result.secretsDetected.length === 0;

    const vulnerabilityCounts = result.secretsDetected.reduce((acc, secret) => {
        acc[secret.type] = (acc[secret.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const pieData = Object.keys(vulnerabilityCounts).map(key => {
        const severity = result.secretsDetected.find(s => s.type === key)?.severity;
        return {
            name: key.replace(/_/g, ' '),
            value: vulnerabilityCounts[key],
            fill: severity === 'Critical' ? '#ff3131' : severity === 'Medium' ? '#f59e0b' : '#10b981'
        };
    });

    const severityCounts = { Critical: 0, Medium: 0, Low: 0 };
    result.secretsDetected.forEach(secret => {
        severityCounts[secret.severity] = (severityCounts[secret.severity] || 0) + 1;
    });

    const severityData = [
        { name: 'Critical', count: severityCounts.Critical, fill: '#ff3131' },
        { name: 'Medium', count: severityCounts.Medium, fill: '#f59e0b' },
        { name: 'Low', count: severityCounts.Low, fill: '#10b981' },
    ];



    return (
        <div className="w-full flex flex-col gap-6 pb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to="/history" className="h-10 w-10 rounded-lg glass-card flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white">Vulnerability Lab</h2>
                        <p className="text-sm text-slate-400 font-mono">Target: {result.fileName} | ID: {result.scanId.slice(0, 8)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {/* Risk Score Panel */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <span className="material-symbols-outlined text-8xl">radar</span>
                    </div>
                    <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-6 w-full text-center">OVERALL RISK SCORE</h3>

                    <div className="relative flex items-center justify-center w-48 h-48 mb-4">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="96" cy="96" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                            <motion.circle
                                cx="96" cy="96" r="80" fill="none"
                                stroke={isClear ? '#10b981' : result.riskScore > 50 ? '#ff3131' : '#f59e0b'}
                                strokeWidth="12"
                                strokeDasharray="502"
                                initial={{ strokeDashoffset: 502 }}
                                animate={{ strokeDashoffset: 502 - (502 * result.riskScore) / 100 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-6xl font-black ${isClear ? 'text-emerald-400' : result.riskScore > 50 ? 'text-threat' : 'text-yellow-500'}`}>
                                {result.riskScore}
                            </span>
                            <span className="text-xs text-slate-500 font-bold tracking-widest uppercase">/100</span>
                        </div>
                    </div>

                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${isClear ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        result.riskScore > 50 ? 'bg-threat/10 text-threat border-threat/20' :
                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}>
                        {result.severity} SEVERITY
                    </div>
                </motion.div>

                {/* Threat Composition Donut */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                    <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2 w-full text-center">COMPOSITION</h3>

                    <div className="flex-1 w-full h-48 relative">
                        {isClear ? (
                            <div className="absolute inset-0 flex items-center justify-center opacity-50">
                                <span className="material-symbols-outlined text-4xl text-emerald-500">done_all</span>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: 'rgba(10, 6, 18, 0.9)', borderColor: '#a60df2', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>

                {/* Severity Distribution */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                    <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2 w-full text-center">SEVERITY</h3>

                    <div className="flex-1 w-full h-48 relative">
                        {isClear ? (
                            <div className="absolute inset-0 flex items-center justify-center opacity-50">
                                <span className="material-symbols-outlined text-4xl text-emerald-500">done_all</span>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={severityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <RechartsTooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: 'rgba(10, 6, 18, 0.9)', borderColor: '#a60df2', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                        {severityData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>

                {/* Vulnerability List */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3 xl:col-span-2 glass-card rounded-xl p-6 flex flex-col h-[350px]">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">bug_report</span>
                        Detected Vulnerabilities
                        <span className="ml-auto bg-primary/20 text-primary text-xs px-2 py-1 rounded-md font-mono">{result.secretsDetected.length} found</span>
                    </h3>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        {isClear ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                                <span className="material-symbols-outlined text-6xl text-emerald-500 mb-4">verified_user</span>
                                <h4 className="text-xl text-emerald-400 font-bold mb-2">SYSTEM SECURE</h4>
                                <p className="text-slate-400 max-w-sm">No known heuristic signatures or hardcoded secrets detected in this target.</p>
                            </div>
                        ) : (
                            result.secretsDetected.map((secret, idx) => (
                                <div key={idx} className="bg-background-dark/80 border border-white/5 rounded-lg p-4 flex gap-4 hover:border-primary/30 transition-colors">
                                    <div className={`mt-1 p-2 rounded-lg shrink-0 ${secret.severity === 'Critical' ? 'bg-threat/10 text-threat' : secret.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-secondary/10 text-secondary'}`}>
                                        <span className="material-symbols-outlined block text-[20px]">
                                            {secret.severity === 'Critical' ? 'emergency' : secret.severity === 'Medium' ? 'warning' : 'info'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-white truncate">{secret.type.replace(/_/g, ' ')}</h4>
                                            <span className="bg-white/5 text-slate-400 text-xs px-2 py-0.5 rounded font-mono whitespace-nowrap">Line {secret.line}</span>
                                        </div>
                                        <div className="bg-black/50 p-2 rounded border border-white/5 font-mono text-xs text-red-400 overflow-x-auto whitespace-pre mb-2 custom-scrollbar">
                                            {settings?.security?.maskSecrets ? '****************' : secret.match}
                                        </div>
                                        <p className="text-xs text-slate-400 flex items-start gap-1">
                                            <span className="material-symbols-outlined text-[14px] text-secondary shrink-0 pt-[2px]">lightbulb</span>
                                            Suggestion: Remove hardcoded credential and abstract into an environment variable or secrets manager.
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Code Viewer Container */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl overflow-hidden flex flex-col h-[500px]">
                <div className="bg-background-dark/90 px-4 py-3 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">code</span>
                        <span className="text-sm font-medium text-slate-300">Target Source Code</span>
                    </div>
                    <button className="text-slate-500 hover:text-white transition-colors p-1" title="Copy code">
                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    </button>
                </div>
                <div className="flex-1 relative">
                    <Editor
                        height="100%"
                        defaultLanguage="javascript"
                        theme="vs-dark"
                        value={codeContent}
                        options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            fontSize: 14,
                            fontFamily: 'JetBrains Mono, monospace',
                            scrollBeyondLastLine: false,
                            padding: { top: 16 }
                        }}
                    />
                </div>
            </motion.div>
        </div >
    );
}
