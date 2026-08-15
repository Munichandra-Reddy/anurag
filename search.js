const fs = require('fs');
const path = require('path');

function searchFiles(dir, filter, pattern) {
    let results = [];
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                if (file !== 'node_modules' && file !== '.next') {
                    results = results.concat(searchFiles(filePath, filter, pattern));
                }
            } else if (filter(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                if (content.includes(pattern)) {
                    results.push(filePath);
                }
            }
        }
    } catch (e) {
        console.error(e);
    }
    return results;
}

const dir = 'd:/Anurag lms/Anurag lms';
const filter = f => !f.includes('node_modules') && !f.includes('.git') && !f.includes('.next');
const pattern = '<<<<<<<';
console.log(searchFiles(dir, filter, pattern));
