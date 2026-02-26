import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { SimpleDB } from './simpledb';
import { scanText, calculateRiskScore } from './detectors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// file upload configuration
const upload = multer({ dest: 'uploads/' });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CipherSentinel API is running' });
});

app.post('/api/scan/text', async (req, res) => {
  try {
    const { text, fileName = 'Pasted Code' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    const secretsDetected = scanText(text);
    const riskScore = calculateRiskScore(secretsDetected);

    // Determine overall severity
    let severity: 'Low' | 'Medium' | 'Critical' = 'Low';
    if (secretsDetected.some(s => s.severity === 'Critical')) severity = 'Critical';
    else if (secretsDetected.some(s => s.severity === 'Medium')) severity = 'Medium';

    const scanResult = {
      scanId: uuidv4(),
      fileName,
      secretsDetected,
      severity,
      riskScore,
      createdAt: new Date().toISOString(),
    };

    await SimpleDB.saveScan(scanResult);
    res.json(scanResult);

  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Internal server error during scan' });
  }
});

app.post('/api/scan/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileContent = await fs.readFile(filePath, 'utf-8');

    const secretsDetected = scanText(fileContent);
    const riskScore = calculateRiskScore(secretsDetected);

    let severity: 'Low' | 'Medium' | 'Critical' = 'Low';
    if (secretsDetected.some(s => s.severity === 'Critical')) severity = 'Critical';
    else if (secretsDetected.some(s => s.severity === 'Medium')) severity = 'Medium';

    const scanResult = {
      scanId: uuidv4(),
      fileName: req.file.originalname,
      secretsDetected,
      severity,
      riskScore,
      createdAt: new Date().toISOString(),
    };

    await SimpleDB.saveScan(scanResult);

    // Clean up uploaded file
    await fs.unlink(filePath).catch(console.error);

    res.json(scanResult);

  } catch (error) {
    console.error('File scan error:', error);
    res.status(500).json({ error: 'Internal server error during file scan' });
  }
});

app.get('/api/scans', async (req, res) => {
  try {
    const scans = await SimpleDB.getAllScans();
    // Return sorted by newest first
    res.json(scans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scan history' });
  }
});

app.get('/api/scans/:id', async (req, res) => {
  try {
    const scan = await SimpleDB.getScanById(req.params.id);
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    res.json(scan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scan result' });
  }
});

app.delete('/api/scans/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await SimpleDB.deleteScan(id);
    res.json({ message: 'Scan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete scan' });
  }
});

app.post('/api/scans/clear', async (req, res) => {
  try {
    await SimpleDB.clearHistory();
    res.json({ message: 'History cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await SimpleDB.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const settings = req.body;
    await SimpleDB.saveSettings(settings);
    res.json({ message: 'Settings saved', settings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
