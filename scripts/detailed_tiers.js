
const fs = require('fs');
const html = fs.readFileSync('/home/kacho/src/github.com/neon-uriel/IIDX-Tier-Tracker/backend/url_content_raw.html', 'utf8');

const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
const data = JSON.parse(match[1]);
const table11 = data.props.pageProps.tables.tables.find(t => t.id === '11_hard');

const songs = table11.table.data;

// Group by category and tier
const groups = {};
songs.forEach(s => {
    const key = (s.category || 'NONE') + '.' + s.tier;
    if (!groups[key]) groups[key] = [];
    groups[key].push(s.name);
});

// Sort keys and print
const sortedKeys = Object.keys(groups).sort((a, b) => {
    const [catA, tierA] = a.split('.');
    const [catB, tierB] = b.split('.');
    if (catA !== catB) return catA.localeCompare(catB);
    return parseInt(tierA) - parseInt(tierB);
});

sortedKeys.forEach(key => {
    console.log(`${key}: ${groups[key].slice(0, 3).join(', ')} (${groups[key].length})`);
});
