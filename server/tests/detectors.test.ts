import { scanText, calculateRiskScore } from '../detectors';

describe('Secret Detector Engine', () => {
    it('should detect AWS Access Keys', () => {
        const text = 'Here is an aws key: AKIA_FAKE_ACCESS_KEY';
        const results = scanText(text);

        expect(results.length).toBe(1);
        expect(results[0].type).toBe('AWS_ACCESS_KEY');
        expect(results[0].severity).toBe('Critical');
        expect(results[0].line).toBe(1);
        expect(results[0].match).toBe('AKIA_FAKE_ACCESS_KEY');
    });

    it('should detect JWT Tokens', () => {
        const text = `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI.eyJzdWIiOiIxMjM0NTY3ODkw.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
        const results = scanText(text);

        expect(results.find((r) => r.type === 'JWT_TOKEN')).toBeDefined();
    });

    it('should calculate accurate risk scores', () => {
        const results = [
            { type: 'AWS_ACCESS_KEY', match: 'foo', line: 1, severity: 'Critical' as const },
            { type: 'JWT_TOKEN', match: 'bar', line: 2, severity: 'Medium' as const }
        ];

        const score = calculateRiskScore(results);
        expect(score).toBe(45); // 30 + 15
    });

    it('cap risk score at 100', () => {
        const results = [
            { type: 'AWS_ACCESS_KEY', match: 'foo', line: 1, severity: 'Critical' as const },
            { type: 'AWS_ACCESS_KEY', match: 'foo2', line: 2, severity: 'Critical' as const },
            { type: 'AWS_ACCESS_KEY', match: 'foo3', line: 3, severity: 'Critical' as const },
            { type: 'AWS_ACCESS_KEY', match: 'foo4', line: 4, severity: 'Critical' as const }
        ];

        const score = calculateRiskScore(results);
        expect(score).toBe(100); // capped at 100 (would be 120)
    });
});
