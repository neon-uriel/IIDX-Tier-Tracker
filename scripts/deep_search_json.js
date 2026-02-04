
const fs = require('fs');
const html = fs.readFileSync('/home/kacho/src/github.com/neon-uriel/IIDX-Tier-Tracker/backend/url_content_raw.html', 'utf8');

const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
const data = JSON.parse(match[1]);

// Recursive search for key/value
function searchJSON(obj, key, path = '') {
    if (typeof obj === 'string') {
        if (obj.includes(key)) {
            console.log(`Found "${key}" at ${path}: "${obj}"`);
        }
        return;
    }
    if (typeof obj === 'object' && obj !== null) {
        for (const k in obj) {
            searchJSON(obj[k], key, `${path}.${k}`);
        }
    }
}

console.log('Searching for "S+"...');
searchJSON(data, "S+");

console.log('Searching for "地力"...');
searchJSON(data, "地力");

console.log('Searching for "Tier"...');
searchJSON(data.props.pageProps.tables, "Tier");
