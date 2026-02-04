const fs = require('fs');
const content = fs.readFileSync('url_content.txt', 'utf-8');
const match = content.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
if (match) {
    const data = JSON.parse(match[1]);
    const tables = data.props.pageProps.tables.tables;
    const normalTable = tables.find(t => t.id === '11_normal');
    if (normalTable) {
        console.log('Table Name:', normalTable.table.name);
        const tiersMap = {};
        normalTable.table.data.forEach(song => {
            if (!tiersMap[song.tier]) tiersMap[song.tier] = [];
            if (tiersMap[song.tier].length < 1) tiersMap[song.tier].push(song.name);
        });
        console.log('Tiers Found:', JSON.stringify(tiersMap, null, 2));
    } else {
        console.log('11_normal table not found');
    }
}
