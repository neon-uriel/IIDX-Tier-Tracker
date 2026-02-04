
const fs = require('fs');
const html = fs.readFileSync('/home/kacho/src/github.com/neon-uriel/IIDX-Tier-Tracker/backend/url_content_raw.html', 'utf8');

const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
const data = JSON.parse(match[1]);
const table11 = data.props.pageProps.tables.tables.find(t => t.id === '11_hard');

console.log('Keys in table:', Object.keys(table11.table));
if (table11.table.tiers) {
    console.log('Tiers information:', JSON.stringify(table11.table.tiers, null, 2));
} else {
    console.log('No tiers property found in table object');
}

// Check other possible locations for tier labels
console.log('Keys in pageProps:', Object.keys(data.props.pageProps));
if (data.props.pageProps.difficultyLabels) {
    console.log('Difficulty Labels:', JSON.stringify(data.props.pageProps.difficultyLabels, null, 2));
}
