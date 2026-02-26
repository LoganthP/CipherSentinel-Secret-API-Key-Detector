import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:5000/api';

type Tab = 'scanner' | 'data' | 'security' | 'performance';

interface AppSettings {
    scanner: {
        deepScan: boolean;
        sensitivity: 'Low' | 'Medium' | 'High';
        fileSizeLimit: number;
        detectApyKeys: boolean;
        detectTokens: boolean;
        detectPasswords: boolean;
        detectPrivateKeys: boolean;
        detectEnvLeaks: boolean;
        detectPemLeaks: boolean;
    };
    data: {
        autoDeleteOldScans: boolean;
    };
    security: {
        privacyMode: boolean;
        maskSecrets: boolean;
    };
    performance: {
        fastScanMode: boolean;
        parallelScanning: boolean;
        cacheResults: boolean;
    };
}

const DEFAULT_SETTINGS: AppSettings = {
    scanner: {
        deepScan: false,
        sensitivity: 'Medium',
        fileSizeLimit: 10,
        detectApyKeys: true,
        detectTokens: true,
        detectPasswords: true,
        detectPrivateKeys: true,
        detectEnvLeaks: true,
        detectPemLeaks: true,
    },
    data: {
        autoDeleteOldScans: false,
    },
    security: {
        privacyMode: true,
        maskSecrets: true,
    },
    performance: {
        fastScanMode: true,
        parallelScanning: true,
        cacheResults: true,
    }
};

export default function Settings() {
    const [activeTab, setActiveTab] = useState<Tab>('scanner');
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch(`${API_BASE}/settings`);
                const data = await response.json();
                setSettings(data);
            } catch (error) {
                console.error('Failed to fetch settings', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (newSettings: AppSettings) => {
        try {
            await fetch(`${API_BASE}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings)
            });
            setSettings(newSettings);
            setSaveMessage('Settings updated successfully');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            console.error('Failed to save settings', error);
        }
    };

    const updateSetting = (category: keyof AppSettings, field: string, value: string | boolean | number) => {
        const newSettings = {
            ...settings,
            [category]: {
                ...settings[category],
                [field]: value
            }
        };
        handleSave(newSettings);
    };

    const clearHistory = async () => {
        if (!confirm('Are you sure you want to clear all scan history? This action cannot be undone.')) return;

        try {
            await fetch(`${API_BASE}/scans/clear`, { method: 'POST' });
            alert('Scan history cleared successfully!');
        } catch (error) {
            console.error('Failed to clear history', error);
            alert('Failed to clear scan history.');
        }
    };

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'scanner', label: 'Scanner', icon: 'radar' },
        { id: 'data', label: 'Data', icon: 'database' },
        { id: 'security', label: 'Security', icon: 'security' },
        { id: 'performance', label: 'Performance', icon: 'speed' }
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
                <div className="text-primary font-mono animate-pulse">LOADING SETTINGS...</div>
            </div>
        );
    }

    const Toggle = ({ checked, onChange, label, description }: { checked: boolean, onChange: (c: boolean) => void, label: string, description?: string }) => (
        <div className="flex items-center justify-between p-4 glass-card rounded-xl hover:border-primary/30 transition-colors">
            <div>
                <h4 className="text-white font-medium">{label}</h4>
                {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 shrink-0 ${checked ? 'bg-primary neon-glow-purple' : 'bg-slate-700'}`}
            >
                <motion.div
                    initial={false}
                    animate={{ x: checked ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="w-4 h-4 rounded-full bg-white shadow-sm"
                />
            </button>
        </div>
    );

    const Select = ({ value, onChange, options, label, description }: { value: string, onChange: (v: string) => void, options: string[], label: string, description?: string }) => (
        <div className="flex items-center justify-between p-4 glass-card rounded-xl hover:border-primary/30 transition-colors">
            <div>
                <h4 className="text-white font-medium">{label}</h4>
                {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
            </div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-background-dark/80 border border-primary/20 text-white rounded-lg px-4 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );

    return (
        <div className="w-full flex flex-col gap-6 pb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-1">System Configuration</h2>
                    <p className="text-sm text-slate-400 font-mono">Modify parameters and system behaviors.</p>
                </div>
                <AnimatePresence>
                    {saveMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                            {saveMessage}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-primary/20 text-white border border-primary/30 shadow-[0_0_15px_rgba(166,13,242,0.1)]'
                                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                            <span className="font-medium">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            {activeTab === 'scanner' && (
                                <>
                                    <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Scanner Settings</h3>
                                    <Toggle
                                        label="Deep Scan Mode"
                                        description="Performs heuristic analysis and secondary pattern matching on complex files. May take longer."
                                        checked={settings.scanner.deepScan}
                                        onChange={(v) => updateSetting('scanner', 'deepScan', v)}
                                    />
                                    <Select
                                        label="Scan Sensitivity"
                                        description="Set the threshold for flags. High sensitivity may produce false positives."
                                        value={settings.scanner.sensitivity}
                                        options={['Low', 'Medium', 'High']}
                                        onChange={(v) => updateSetting('scanner', 'sensitivity', v)}
                                    />
                                    <Select
                                        label="File Size Limit"
                                        value={settings.scanner.fileSizeLimit.toString()}
                                        options={['1', '5', '10', '50', '100']}
                                        onChange={(v) => updateSetting('scanner', 'fileSizeLimit', parseInt(v))}
                                    />

                                    <div className="mt-8">
                                        <h4 className="text-white font-bold mb-3 uppercase tracking-widest text-xs">Detection Signatures</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Toggle label="API Keys" checked={settings.scanner.detectApyKeys} onChange={(v) => updateSetting('scanner', 'detectApyKeys', v)} />
                                            <Toggle label="Tokens" checked={settings.scanner.detectTokens} onChange={(v) => updateSetting('scanner', 'detectTokens', v)} />
                                            <Toggle label="Passwords" checked={settings.scanner.detectPasswords} onChange={(v) => updateSetting('scanner', 'detectPasswords', v)} />
                                            <Toggle label="Private Keys" checked={settings.scanner.detectPrivateKeys} onChange={(v) => updateSetting('scanner', 'detectPrivateKeys', v)} />
                                            <Toggle label=".env Leaks" checked={settings.scanner.detectEnvLeaks} onChange={(v) => updateSetting('scanner', 'detectEnvLeaks', v)} />
                                            <Toggle label=".pem Leaks" checked={settings.scanner.detectPemLeaks} onChange={(v) => updateSetting('scanner', 'detectPemLeaks', v)} />
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'data' && (
                                <>
                                    <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Data Management</h3>
                                    <Toggle
                                        label="Auto-Delete Old Scans"
                                        description="Automatically prune scans older than 30 days."
                                        checked={settings.data.autoDeleteOldScans}
                                        onChange={(v) => updateSetting('data', 'autoDeleteOldScans', v)}
                                    />

                                    <div className="mt-8 space-y-4">
                                        <div className="p-4 glass-card rounded-xl border border-threat/20">
                                            <h4 className="text-white font-medium mb-1">Clear Scan History</h4>
                                            <p className="text-sm text-slate-400 mb-4">Permanently delete all stored scan history and results. This cannot be undone.</p>
                                            <button
                                                onClick={clearHistory}
                                                className="px-4 py-2 rounded-lg bg-threat/10 hover:bg-threat/20 text-threat border border-threat/30 font-medium text-sm flex items-center gap-2 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                                                Purge Database
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'security' && (
                                <>
                                    <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Security & Privacy</h3>
                                    <Toggle
                                        label="Privacy Mode"
                                        description="Do not store scanned files locally. Scans will be kept in memory only."
                                        checked={settings.security.privacyMode}
                                        onChange={(v) => updateSetting('security', 'privacyMode', v)}
                                    />
                                    <Toggle
                                        label="Mask Secrets in Results"
                                        description="Display secrets as **** in the vulnerability lab to prevent screen surfing."
                                        checked={settings.security.maskSecrets}
                                        onChange={(v) => updateSetting('security', 'maskSecrets', v)}
                                    />
                                </>
                            )}

                            {activeTab === 'performance' && (
                                <>
                                    <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Performance Config</h3>
                                    <Toggle
                                        label="Fast Scan Mode"
                                        description="Prioritize speed over strict heuristic accuracy."
                                        checked={settings.performance.fastScanMode}
                                        onChange={(v) => updateSetting('performance', 'fastScanMode', v)}
                                    />
                                    <Toggle
                                        label="Parallel Scanning"
                                        description="Utilize parallel threading for heavy file workloads."
                                        checked={settings.performance.parallelScanning}
                                        onChange={(v) => updateSetting('performance', 'parallelScanning', v)}
                                    />
                                    <Toggle
                                        label="Cache Results"
                                        description="Cache recurring code snippets to save compute."
                                        checked={settings.performance.cacheResults}
                                        onChange={(v) => updateSetting('performance', 'cacheResults', v)}
                                    />
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
