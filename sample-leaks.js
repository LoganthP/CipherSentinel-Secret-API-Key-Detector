// Simulated Configuration File with Leaks

const AWS_CONFIG = {
    region: 'us-east-1',
    accessKeyId: 'AKIA_FAKE_ACCESS_KEY', // critical leak
    secretAccessKey: 'FAKE_SECRET_ACCESS_KEY' // critical leak
};

// Database credentials
const DB_USER = 'admin';
const DB_PASS = 'superSecretPassword123!'; // medium leak

// External API Config
const STRIPE_KEY = 'sk_test_FAKE_EXAMPLE_KEY'; // critical leak
const GOOGLE_MAPS = 'AIzaSyBN1234567890abcdefghijklmnopqrstuvwx'; // critical leak

// JSON Web Token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'; // medium leak
