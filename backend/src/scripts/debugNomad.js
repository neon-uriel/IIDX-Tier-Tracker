const axios = require('axios');

async function debug() {
    const nomadUrl = 'https://iidx-difficulty-table-checker.nomadblacky.dev/table/11_normal';
    try {
        const response = await axios.get(nomadUrl);
        const html = response.data;
        const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
        const jsonData = JSON.parse(match[1]);
        const tables = jsonData.props.pageProps.tables.tables;
        const targetTable = tables.find(t => t.id === '11_normal');

        const misses = [
            'ALL MY TURN',
            'CODE:0',
            'Monkey Business',
            'Ubertreffen',
            'X-DEN'
        ];

        console.log("--- MISSING SONGS IN JSON ---");
        const foundMisses = targetTable.table.data.filter(s =>
            misses.some(m => s.name.includes(m))
        );
        console.log(JSON.stringify(foundMisses, null, 2));

        console.log("\n--- FIRST 5 SONGS ---");
        console.log(JSON.stringify(targetTable.table.data.slice(0, 5), null, 2));

    } catch (e) {
        console.error(e);
    }
}

debug();
