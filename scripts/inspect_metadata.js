
const fs = require('fs');
const html = fs.readFileSync('/home/kacho/src/github.com/neon-uriel/IIDX-Tier-Tracker/backend/url_content_raw.html', 'utf8');

const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
const data = JSON.parse(match[1]);

console.log('pageProps keys:', Object.keys(data.props.pageProps));
if (data.props.pageProps.table) {
    console.log('table metadata:', JSON.stringify(data.props.pageProps.table, (key, value) => {
        if (key === 'data') return '[array]';
        return value;
    }, 2));
}
