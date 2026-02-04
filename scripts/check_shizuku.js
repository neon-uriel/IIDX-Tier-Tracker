
const fs = require('fs');
const html = fs.readFileSync('/home/kacho/src/github.com/neon-uriel/IIDX-Tier-Tracker/backend/url_content_raw.html', 'utf8');

const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
const data = JSON.parse(match[1]);

const tableHard = data.props.pageProps.tables.tables.find(t => t.id === '11_hard');
const tableNormal = data.props.pageProps.tables.tables.find(t => t.id === '11_normal');

const shizukuHard = tableHard.table.data.find(s => s.name === '雫');
const shizukuNormal = tableNormal.table.data.find(s => s.name === '雫');

console.log('--- 11_hard ---');
console.log(shizukuHard);

console.log('--- 11_normal ---');
console.log(shizukuNormal);
