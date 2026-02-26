import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../simpledb-data/scans.json');
const SETTINGS_PATH = path.join(__dirname, '../../simpledb-data/settings.json');

export interface AppSettings {
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

export interface ScanResult {
    scanId: string;
    fileName: string;
    secretsDetected: Array<{ type: string; match: string; line?: number }>;
    severity: 'Low' | 'Medium' | 'Critical';
    riskScore: number;
    createdAt: string;
}

export class SimpleDB {
    private static async ensureDbExists() {
        try {
            await fs.access(DB_PATH);
        } catch {
            await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
            await fs.writeFile(DB_PATH, JSON.stringify([]));
        }

        try {
            await fs.access(SETTINGS_PATH);
        } catch {
            await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
            await fs.writeFile(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
        }
    }

    static async getAllScans(): Promise<ScanResult[]> {
        await this.ensureDbExists();
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    }

    static async getScanById(id: string): Promise<ScanResult | undefined> {
        const scans = await this.getAllScans();
        return scans.find((s) => s.scanId === id);
    }

    static async deleteScan(id: string): Promise<void> {
        const scans = await this.getAllScans();
        const updatedScans = scans.filter(s => s.scanId !== id);
        await fs.writeFile(DB_PATH, JSON.stringify(updatedScans, null, 2));
    }

    static async saveScan(scan: ScanResult): Promise<void> {
        const scans = await this.getAllScans();
        scans.push(scan);
        await fs.writeFile(DB_PATH, JSON.stringify(scans, null, 2));
    }

    static async getSettings(): Promise<AppSettings> {
        await this.ensureDbExists();
        const data = await fs.readFile(SETTINGS_PATH, 'utf-8');
        return JSON.parse(data);
    }

    static async saveSettings(settings: AppSettings): Promise<void> {
        await this.ensureDbExists();
        await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));
    }

    static async clearHistory(): Promise<void> {
        await fs.writeFile(DB_PATH, JSON.stringify([]));
    }
}
