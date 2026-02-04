
const fs = require('fs');
const html = fs.readFileSync('/home/kacho/src/github.com/neon-uriel/IIDX-Tier-Tracker/backend/url_content_raw.html', 'utf8');

const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
if (!match) {
    console.log('JSON not found');
    process.exit(1);
}

const data = JSON.parse(match[1]);
const tables = data.props.pageProps.tables.tables;

tables.forEach(t => {
    console.log(`Table ID: ${t.id}, Name: ${t.table.name}`);
});
