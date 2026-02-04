/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.alterColumn('songs', 'sub_level', {
        type: 'VARCHAR(30)',
        default: null
    });
};

exports.down = pgm => {
    // Reverting to 10 might truncate data, but strictly speaking it's the reverse op.
    // In practice we might not want to revert this if data is longer.
    pgm.alterColumn('songs', 'sub_level', {
        type: 'VARCHAR(10)'
    });
};
