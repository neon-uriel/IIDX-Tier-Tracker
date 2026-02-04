
const fs = require('fs');
const cheerio = require('cheerio');

const path = '/home/kacho/src/github.com/neon-uriel/IIDX-Tier-Tracker/backend/view-source_https___w.atwiki.jp_bemani2sp11_pages_22.html';
const fileContent = fs.readFileSync(path, 'utf8');

const $source = cheerio.load(fileContent);
let reconstructedHtml = "";

$source('td.line-content').each((i, el) => {
    reconstructedHtml += $source(el).text() + "\n";
});

console.log("--- Reconstructed HTML Snippet (First 500 chars) ---");
console.log(reconstructedHtml.substring(0, 500));

console.log("--- Parsing Reconstructed HTML ---");
const $ = cheerio.load(reconstructedHtml);

// Try to find a song row
// Based on grep: <tr>...<td>Acid Pumper</td>...<td>地力B</td></tr>
// Note: In the reconstructed HTML, it should be standard <tr><td>...

const song = $('td:contains("Acid Pumper")');
if (song.length) {
    const row = song.closest('tr');
    const cols = row.find('td');
    console.log(`Found 'Acid Pumper'. Row has ${cols.length} columns.`);
    cols.each((i, el) => {
        console.log(`Col ${i}: ${$(el).text().trim().replace(/\s+/g, ' ')}`);
    });
} else {
    console.log("Could not find 'Acid Pumper' in reconstructed HTML.");
}
