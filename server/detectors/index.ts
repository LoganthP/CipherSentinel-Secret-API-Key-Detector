const SECRET_PATTERNS = [
    {
        type: 'AWS_ACCESS_KEY',
        regex: /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
        severity: 'Critical',
    },
    {
        type: 'AWS_SECRET_KEY',
        regex: new RegExp('aws_(?:secret_access_key|secret_key).{0,50}([\'"][a-zA-Z0-9/+=]{40}[\'"])', 'ig'),
        severity: 'Critical',
    },
    {
        type: 'GITHUB_TOKEN',
        regex: /(ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}/g,
        severity: 'Critical',
    },
    {
        type: 'JWT_TOKEN',
        regex: /ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g,
        severity: 'Medium',
    },
    {
        type: 'PRIVATE_KEY',
        regex: /-----BEGIN (RSA|OPENSSH|DSA|EC|PGP) PRIVATE KEY-----/g,
        severity: 'Critical',
    },
    {
        type: 'GOOGLE_API_KEY',
        regex: /AIza[0-9A-Za-z\-_]{35}/g,
        severity: 'Critical',
    },
    {
        type: 'STRIPE_SECRET_KEY',
        regex: /sk_(live|test)_[0-9a-zA-Z]{24}/g,
        severity: 'Critical',
    },
    {
        type: 'SLACK_TOKEN',
        regex: /xox[baprs]-[0-9a-zA-Z]{10,48}/g,
        severity: 'Critical',
    },
    {
        type: 'GENERIC_PASSWORD',
        regex: new RegExp('(password|passwd|pwd|secret).{0,20}[\'"][^\'"]{5,}[\'"]', 'ig'),
        severity: 'Medium',
    },
    {
        type: 'GENERIC_BEARER',
        regex: new RegExp('bearer [a-zA-Z0-9\\-._~+/]+=*', 'ig'),
        severity: 'Medium',
    },
];

export interface SecretMatch {
    type: string;
    match: string;
    line: number;
    severity: 'Low' | 'Medium' | 'Critical';
}

export function scanText(text: string): SecretMatch[] {
    const matches: SecretMatch[] = [];
    const lines = text.split(/\r?\n/);

    lines.forEach((lineText, index) => {
        const lineNumber = index + 1;

        for (const pattern of SECRET_PATTERNS) {
            let match;
            pattern.regex.lastIndex = 0; // Reset state for global regex
            while ((match = pattern.regex.exec(lineText)) !== null) {
                matches.push({
                    type: pattern.type,
                    match: match[0],
                    line: lineNumber,
                    severity: pattern.severity as 'Low' | 'Medium' | 'Critical',
                });
            }
        }
    });

    return matches;
}

export function calculateRiskScore(secrets: SecretMatch[]): number {
    if (secrets.length === 0) return 0;

    let score = 0;
    for (const s of secrets) {
        if (s.severity === 'Critical') score += 30;
        else if (s.severity === 'Medium') score += 15;
        else score += 5;
    }

    // Cap at 100
    return Math.min(score, 100);
}
