/* eslint-disable camelcase */

/**
 * Migration: Add sub_level column to songs table
 *
 * This column stores the subdivided difficulty level for each song.
 * - Can be a decimal number like 10.1, 10.2, etc.
 * - Can be NULL to indicate "未分類" (unclassified)
 * - Using VARCHAR to support both numeric values and potential special values
 */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.addColumn('songs', {
        sub_level: {
            type: 'VARCHAR(10)',
            default: null,
            comment: 'Subdivided difficulty level (e.g., 10.1, 10.2) or NULL for unclassified'
        }
    });

    // Add index for efficient queries by sub_level
    pgm.createIndex('songs', 'sub_level');
};

exports.down = pgm => {
    pgm.dropIndex('songs', 'sub_level');
    pgm.dropColumn('songs', 'sub_level');
};
