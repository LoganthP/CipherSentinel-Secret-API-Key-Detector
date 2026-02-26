import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api';

interface ScanHistoryItem {
    scanId: string;
    fileName: string;
    secretsDetected: Record<string, unknown>[];
    severity: 'Low' | 'Medium' | 'Critical';
    riskScore: number;
    createdAt: string;
}

export default function ScanHistory() {
    const [history, setHistory] = useState<ScanHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (deletingId !== id) {
            setDeletingId(id);
            return;
        }

        try {
            await fetch(`${API_BASE}/scans/${id}`, { method: 'DELETE' });
            setHistory(prev => prev.filter(scan => scan.scanId !== id));
            setDeletingId(null);
        } catch (error) {
            console.error('Failed to delete scan', error);
            alert('Failed to delete scan');
            setDeletingId(null);
        }
    };

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

    const filteredHistory = history.filter((item) =>
        item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.scanId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-4xl">database</span>
                        Scan <span className="text-secondary">Archive</span>
                    </h2>
                    <p className="text-slate-400 font-mono mt-1 text-sm">Historical telemetry of all initialized scans</p>
                </div>

                <div className="relative w-full md:w-auto">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[20px]">search</span>
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-64 bg-background-dark/80 border border-primary/20 rounded-lg py-2 pl-10 pr-4 text-sm font-mono outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all text-slate-200 placeholder-slate-600"
                    />
                </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-4">
                        <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
                        <div className="text-primary font-mono animate-pulse tracking-widest text-sm">ACCESSING DATABASE...</div>
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-4 text-slate-500">
                        <span className="material-symbols-outlined text-5xl opacity-50">search_off</span>
                        <div className="font-mono text-sm">No historical records found.</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-display">
                            <thead className="bg-black/40 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-primary/20">
                                <tr>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Target Name</th>
                                    <th className="px-6 py-4">Secrets Found</th>
                                    <th className="px-6 py-4">Risk Score</th>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredHistory.map((scan, idx) => (
                                    <motion.tr
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={scan.scanId}
                                        className="hover:bg-primary/5 transition-colors group cursor-default"
                                    >
                                        <td className="px-6 py-4">
                                            {scan.secretsDetected.length > 0 ? (
                                                <div className={`p-1.5 rounded-md inline-flex ${scan.severity === 'Critical' ? 'bg-threat/10 text-threat' : scan.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-secondary/10 text-secondary'}`}>
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {scan.severity === 'Critical' ? 'emergency' : scan.severity === 'Medium' ? 'warning' : 'info'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="p-1.5 rounded-md inline-flex bg-emerald-500/10 text-emerald-500">
                                                    <span className="material-symbols-outlined text-[18px]">verified</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-slate-300 font-medium">
                                            {scan.fileName}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono ${scan.secretsDetected.length > 0 ? 'bg-threat/10 text-threat border border-threat/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                                {scan.secretsDetected.length}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700">
                                                    <div
                                                        className={`h-full ${scan.riskScore > 50 ? 'bg-threat shadow-[0_0_8px_rgba(255,49,49,0.8)]' : scan.riskScore > 0 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${Math.max(scan.riskScore, 5)}%` }}
                                                    />
                                                </div>
                                                <span className={`text-xs font-bold font-mono ${scan.riskScore > 50 ? 'text-threat' : scan.riskScore > 0 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                                                    {scan.riskScore}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                                            {new Date(scan.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => handleDelete(scan.scanId, e)}
                                                    onMouseLeave={() => deletingId === scan.scanId && setDeletingId(null)}
                                                    className={`inline-flex items-center justify-center p-2 rounded-lg transition-all shadow-sm ${deletingId === scan.scanId
                                                        ? 'bg-threat text-white border-threat shadow-[0_0_15px_rgba(255,49,49,0.4)]'
                                                        : 'bg-threat/5 hover:bg-threat/20 border border-transparent hover:border-threat/30 text-slate-500 hover:text-threat shadow-sm group-hover:shadow-[0_0_10px_rgba(255,49,49,0.2)]'
                                                        }`}
                                                    title={deletingId === scan.scanId ? "Click again to confirm delete" : "Delete Scan"}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {deletingId === scan.scanId ? 'gpp_maybe' : 'delete'}
                                                    </span>
                                                    {deletingId === scan.scanId && (
                                                        <span className="ml-2 text-[10px] font-bold uppercase tracking-tighter">Confirm</span>
                                                    )}
                                                </button>
                                                <Link
                                                    to={`/scan/${scan.scanId}`}
                                                    className="inline-flex items-center justify-center p-2 rounded-lg bg-background-light/5 hover:bg-primary border border-white/5 hover:border-primary text-slate-400 hover:text-white transition-all shadow-sm group-hover:shadow-[0_0_10px_rgba(166,13,242,0.3)]"
                                                    title="View Report"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                                </Link>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
