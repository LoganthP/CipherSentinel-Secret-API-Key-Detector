import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE = 'http://localhost:5000/api';

interface ScanHistoryItem {
    scanId: string;
    fileName: string;
    secretsDetected: Record<string, unknown>[];
    severity: 'Low' | 'Medium' | 'Critical';
    riskScore: number;
    createdAt: string;
}

export default function LandingPage() {
    const [history, setHistory] = useState<ScanHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch(`${API_BASE}/scans`);
                const data = await response.json();
                setHistory(data);
            } catch (error) {
                console.error('Failed to fetch scan history', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const totalScans = history.length;
    const secretsFound = history.reduce((acc, curr) => acc + curr.secretsDetected.length, 0);
    const criticalThreats = history.filter(h => h.severity === 'Critical').length;

    // Average risk score or just take the maximum
    const avgRiskScore = totalScans > 0
        ? Math.round(history.reduce((acc, curr) => acc + curr.riskScore, 0) / totalScans)
        : 0;

    const chronologicalHistory = [...history].reverse();

    // Data for Risk Trend (Area Chart)
    const riskTrendData = chronologicalHistory.map((scan, index) => ({
        name: `Scan ${index + 1}`,
        riskScore: scan.riskScore,
        date: new Date(scan.createdAt).toLocaleDateString()
    }));

    // Data for Threat Breakdown (Bar Chart)
    const threatBreakdownData = [
        {
            name: 'Low',
            count: chronologicalHistory.filter(h => h.severity === 'Low').length,
            fill: '#10b981' // emerald-400
        },
        {
            name: 'Medium',
            count: chronologicalHistory.filter(h => h.severity === 'Medium').length,
            fill: '#f59e0b' // yellow-500
        },
        {
            name: 'Critical',
            count: chronologicalHistory.filter(h => h.severity === 'Critical').length,
            fill: '#ff3131' // threat
        }
    ];

    return (
        <>
            {/* Risk Score Central Gauge */}
            <section className="flex flex-col items-center justify-center py-10">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative flex items-center justify-center"
                >
                    {/* Circular Progress Background */}
                    <svg className="w-64 h-64 transform -rotate-90">
                        <circle className="text-primary/10" cx="128" cy="128" fill="transparent" r="110" stroke="currentColor" strokeWidth="12" />
                        <motion.circle
                            initial={{ strokeDashoffset: 691 }}
                            animate={{ strokeDashoffset: 691 - (691 * avgRiskScore) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="text-primary neon-glow-purple transition-all duration-1000"
                            cx="128" cy="128" fill="transparent" r="110" stroke="currentColor"
                            strokeDasharray="691" strokeWidth="12"
                        />
                    </svg>
                    {/* Central Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-5xl font-bold text-white tracking-tighter">{avgRiskScore}%</span>
                        <span className="text-sm font-medium text-primary uppercase tracking-widest mt-1">Avg Risk Level</span>
                    </div>
                    {/* Pulsing Glow Effect */}
                    <div className="absolute inset-0 rounded-full bg-primary/5 blur-3xl animate-pulse-fast pointer-events-none" />
                </motion.div>
                <p className="mt-6 text-slate-400 text-sm max-w-xs text-center">Systems monitoring active. Scan history aggregates displayed.</p>
            </section>

            {/* Quick Stats Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-secondary">database</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center border border-secondary/30">
                            <span className="material-symbols-outlined text-secondary">analytics</span>
                        </div>
                        <p className="text-slate-400 font-medium">Scans Run</p>
                    </div>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-bold text-white z-10">{totalScans}</h3>
                    </div>
                </motion.div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-primary">key</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/30">
                            <span className="material-symbols-outlined text-primary">lock_open</span>
                        </div>
                        <p className="text-slate-400 font-medium">Secrets Found</p>
                    </div>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-bold text-white z-10">{secretsFound}</h3>
                    </div>
                </motion.div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-threat">warning</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-threat/10 flex items-center justify-center border border-threat/30">
                            <span className="material-symbols-outlined text-threat">gpp_maybe</span>
                        </div>
                        <p className="text-slate-400 font-medium">Critical Threats</p>
                    </div>
                    <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-bold text-white z-10">{criticalThreats.toString().padStart(2, '0')}</h3>
                    </div>
                </motion.div>
            </section>

            {/* Visual Telemetry Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-6">
                {/* Risk Trend Chart */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-5 border border-primary/20">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">trending_up</span>
                        Risk Score Trend
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={riskTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a60df2" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#a60df2" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(10, 6, 18, 0.9)', borderColor: '#a60df2', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#00f2ff' }}
                                />
                                <Area type="monotone" dataKey="riskScore" stroke="#a60df2" strokeWidth={3} fillOpacity={1} fill="url(#colorRisk)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Threat Distribution Chart */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="glass-card rounded-xl p-5 border border-primary/20">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">bar_chart</span>
                        Threat Distribution
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={threatBreakdownData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    contentStyle={{ backgroundColor: 'rgba(10, 6, 18, 0.9)', borderColor: '#a60df2', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </section>

            {/* Recent Activity */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-xl font-bold text-white">Recent Projects Activity</h3>
                    <Link to="/history" className="text-primary text-sm font-medium hover:underline">View All</Link>
                </div>

                <div className="glass-card rounded-xl overflow-hidden border border-primary/10">
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="p-8 text-center text-primary font-mono animate-pulse">Fetching records...</div>
                        ) : history.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No recent activity</div>
                        ) : (
                            history.slice(0, 5).map((scan) => {
                                const isSecure = scan.secretsDetected.length === 0;
                                const isCritical = scan.severity === 'Critical';

                                return (
                                    <Link to={`/scan/${scan.scanId}`} key={scan.scanId} className="flex items-center justify-between p-4 border-b border-primary/10 hover:bg-white/5 transition-colors block">
                                        <div className="flex items-center gap-4">
                                            {isSecure ? (
                                                <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                                                    <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                                                </div>
                                            ) : isCritical ? (
                                                <div className="p-2 rounded bg-threat/10 border border-threat/20">
                                                    <span className="material-symbols-outlined text-threat">error</span>
                                                </div>
                                            ) : (
                                                <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                                                    <span className="material-symbols-outlined text-yellow-500">warning</span>
                                                </div>
                                            )}

                                            <div>
                                                <p className="font-medium text-slate-100">{scan.fileName}</p>
                                                <p className="text-xs text-slate-500">
                                                    {new Date(scan.createdAt).toLocaleDateString()} • {scan.secretsDetected.length} secrets found
                                                </p>
                                            </div>
                                        </div>

                                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isSecure ? 'bg-emerald-500/10 text-emerald-400' :
                                            isCritical ? 'bg-threat/10 text-threat' :
                                                'bg-yellow-500/10 text-yellow-500'
                                            }`}>
                                            {isSecure ? 'Secure' : isCritical ? 'Critical' : 'Medium'}
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
