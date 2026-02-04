/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.addColumn('songs', {
        classification: {
            type: 'VARCHAR(10)',
            notNull: true,
            default: 'AC',
            comment: 'AC (Arcade) or CS (Console)'
        }
    });

    // Update existing songs: version 0 is CS, others are AC
    pgm.sql("UPDATE songs SET classification = 'CS' WHERE version = 0");
    pgm.sql("UPDATE songs SET classification = 'AC' WHERE version != 0");

    pgm.createIndex('songs', 'classification');
};

exports.down = pgm => {
    pgm.dropIndex('songs', 'classification');
    pgm.dropColumn('songs', 'classification');
};
