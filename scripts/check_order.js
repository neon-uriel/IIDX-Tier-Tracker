
const fs = require('fs');
const html = fs.readFileSync('/home/kacho/src/github.com/neon-uriel/IIDX-Tier-Tracker/backend/url_content_raw.html', 'utf8');

const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
const data = JSON.parse(match[1]);
const table11 = data.props.pageProps.tables.tables.find(t => t.id === '11_hard');

const songs = table11.table.data;
songs.slice(0, 50).forEach((s, i) => {
    console.log(`${i}: ${s.name} (Tier: ${s.tier}, Cat: ${s.category})`);
});
