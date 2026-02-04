
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync('/home/kacho/src/github.com/neon-uriel/IIDX-Tier-Tracker/backend/url_content_raw.html', 'utf8');

// Find where the JSON starts and ends
const startKey = '{ "songs":';
const startIdx = html.indexOf(startKey);
if (startIdx === -1) {
    // Try another key
    const altKey = '"songs": [';
    const altIdx = html.indexOf(altKey);
    if (altIdx === -1) {
        // Just extract anything that looks like the song array
        const manualMatch = html.match(/\[\s*{\s*"tier":\s*\d+,\s*"version":/);
        if (!manualMatch) {
            console.log('Songs not found');
            process.exit(1);
        }
        // Start from here and find the closing bracket
        let currentPos = manualMatch.index;
        let bracketCount = 0;
        let result = "";
        while (currentPos < html.length) {
            const char = html[currentPos];
            result += char;
            if (char === '[') bracketCount++;
            if (char === ']') bracketCount--;
            if (bracketCount === 0) break;
            currentPos++;
        }
        const songs = JSON.parse(result);
        processSongs(songs);
    } else {
        // Logic for altIdx
        extractAndProcess(altIdx + altKey.length - 1);
    }
} else {
    extractAndProcess(startIdx + startKey.length - 1);
}

function extractAndProcess(startPos) {
    let currentPos = startPos;
    let bracketCount = 0;
    let result = "";
    while (currentPos < html.length) {
        const char = html[currentPos];
        result += char;
        if (char === '[') bracketCount++;
        if (char === ']') bracketCount--;
        if (bracketCount === 0) break;
        currentPos++;
    }
    const songs = JSON.parse(result);
    processSongs(songs);
}

function processSongs(songs) {
    // Group by category and tier
    const groups = {};
    songs.forEach(s => {
        const key = (s.category || 'NONE') + '.' + s.tier;
        if (!groups[key]) groups[key] = [];
        groups[key].push(s.name);
    });

    // Print categories and tiers with some example songs
    Object.keys(groups).sort().forEach(key => {
        console.log(`Key: ${key}`);
        console.log(`  Count: ${groups[key].length}`);
        console.log(`  Examples: ${groups[key].slice(0, 5).join(', ')}`);
    });
}
