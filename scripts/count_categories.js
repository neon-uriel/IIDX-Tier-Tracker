
const fs = require('fs');
const path = '/home/kacho/src/github.com/neon-uriel/IIDX-Tier-Tracker/backend/view-source_https___w.atwiki.jp_bemani2sp11_pages_22.html';
const html = fs.readFileSync(path, 'utf8');

const categories = [
    '未定',
    '個人差S+',
    '地力S',
    '個人差S',
    '個人差A',
    '個人差B',
    '地力C',
    '個人差C',
    '地力D', // Assuming this exists as user mentioned D? No, user list had 個人差D but not 地力D? Let's check user list carefully.
    // User list: 未定, 個人差S+, 地力S, 個人差S, 個人差A, 個人差B, 地力C, 個人差C, 個人差D, 地力E, 個人差E.
    // Wait, where is 地力A, 地力B? The user snippet missed them?
    // "Subに実装してほしい" - implies I should implement *these specific ones* or *all found ones*?
    // "この11個を...読み取って" (Read these 11 items...). 
    // Okay, I will check specifically for these 11 first.
    '個人差D',
    '地力E',
    '個人差E'
];

// Also check for 地力A, 地力B just in case they exist and were omitted from the snippet but might be important.
const extra = ['地力A', '地力B'];

const allCats = [...categories, ...extra];

allCats.forEach(cat => {
    // Simple string count
    const count = (html.match(new RegExp(cat, 'g')) || []).length;
    console.log(`${cat}: ${count}`);
});
