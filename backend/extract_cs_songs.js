const fs = require('fs');

// Mock variable to capture the object from eval
let titletbl = {};
let VERINDEX = 0;
let TITLEINDEX = 5;
let ARTISTINDEX = 4;
let GENREINDEX = 3;

try {
    const fileContent = fs.readFileSync('titletbl.js', 'utf8');
    // Remove variable declarations that might cause syntax errors in strict mode or mock env
    // We just want to execute the assignment to titletbl
    // Simple parsing: split by "titletbl={" and take the content
    const start = fileContent.indexOf('titletbl={');
    if (start === -1) throw new Error("titletbl not found");

    const end = fileContent.lastIndexOf('}');
    const objectStr = fileContent.substring(start + 9, end + 1); // titletbl={...}

    // Evaluate carefully
    // We need to define the constants used in the file if any, but the snippet showed simple values.
    // Actually using eval on the file content might be easier if we strip the var defines or define them.
    // Let's just try to parse the object body or use eval with a context.

    eval(fileContent); // This should populate global titletbl

    const csSongs = [];

    for (const key in titletbl) {
        const data = titletbl[key];
        const version = data[VERINDEX];

        // Textage version 0 usually means CS or non-AC
        if (version === 0) {
            csSongs.push({
                id: key,
                title: data[TITLEINDEX],
                artist: data[ARTISTINDEX],
                genre: data[GENREINDEX]
            });
        }
    }

    console.log(`Found ${csSongs.length} CS songs.`);

    let mdOutput = "# CS専用曲リスト (Textage 'Gray Area')\n\n";
    mdOutput += "| Title | Artist | Genre | ID |\n";
    mdOutput += "|---|---|---|---|\n";

    // Sort by title
    csSongs.sort((a, b) => a.title.localeCompare(b.title));

    csSongs.forEach(s => {
        mdOutput += `| ${s.title} | ${s.artist} | ${s.genre} | ${s.id} |\n`;
    });

    fs.writeFileSync('cs_songs.md', mdOutput);
    console.log("Created cs_songs.md");

} catch (err) {
    console.error("Error parsing titletbl.js:", err);
}
