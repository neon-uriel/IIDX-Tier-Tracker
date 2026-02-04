
const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');

const filePath = '/home/kacho/src/github.com/neon-uriel/IIDX-Tier-Tracker/backend/view-source_https___w.atwiki.jp_bemani2sp11_pages_19.html';

const fileContent = fs.readFileSync(filePath, 'utf8');
const $viewSource = cheerio.load(fileContent);
let realHtml = '';
$viewSource('td.line-content').each((i, el) => {
    realHtml += $viewSource(el).text() + '\n';
});

const $ = cheerio.load(realHtml);

console.log('Real HTML length:', realHtml.length);

// Find headers and tables
$('h1, h2, h3, h4, h5, strong, b').each((i, el) => {
    const text = $(el).text().trim();
    if (text.length > 0 && text.length < 50) { // arbitrary length filter
        if (text.includes('地力') || text.includes('個人差') || i < 20) {
            console.log(`Tag ${el.tagName}:`, text);
        }
    }
});
