const fs = require('fs');
const content = fs.readFileSync('C:\\\\Users\\\\DELL\\\\.gemini\\\\antigravity\\\\brain\\\\9e1fe408-46b0-4569-9a9f-5ea56a9687b5\\\\.system_generated\\\\steps\\\\924\\\\content.md', 'utf-8');
const matches = [...content.matchAll(/\"videoId\":\"([a-zA-Z0-9_-]{11})\"/g)].map(m => m[1]);
console.log([...new Set(matches)].slice(0,10));
