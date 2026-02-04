
const fs = require('fs');
const html = fs.readFileSync('/home/kacho/src/github.com/neon-uriel/IIDX-Tier-Tracker/backend/url_content_raw.html', 'utf8');

const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
const data = JSON.parse(match[1]);
const table11 = data.props.pageProps.tables.tables.find(t => t.id === '11_hard');

const groups = {};
table11.table.data.forEach(s => {
    const key = `${s.category}.${s.tier}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(s.name);
});

// Sort by Category then Tier
const sortedKeys = Object.keys(groups).sort();

console.log('Please help verify the labels (S+, S, A, B, C, F...) for these groups:');
sortedKeys.forEach(k => {
    // Show up to 3 examples
    console.log(`- [ ] **${k}**: ${groups[k].slice(0, 3).join(', ')} ...`);
});
