
const fs = require('fs');
const html = fs.readFileSync('/home/kacho/src/github.com/neon-uriel/IIDX-Tier-Tracker/backend/url_content_raw.html', 'utf8');

const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
const data = JSON.parse(match[1]);
const table11 = data.props.pageProps.tables.tables.find(t => t.id === '11_hard');

const targets = ['Mare Nectaris', '卑弥呼', 'R5', '1st Samurai', 'quaver♪', 'SABER WING'];

targets.forEach(name => {
    const s = table11.table.data.find(row => row.name.includes(name));
    if (s) {
        console.log(`${s.name}: Tier ${s.tier}, Cat ${s.category}, Diff ${s.difficulty}`);
    } else {
        console.log(`${name}: Not found`);
    }
});
