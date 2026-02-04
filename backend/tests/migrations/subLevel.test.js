/**
 * Tests for sub_level column migration
 * These tests verify that the migration file is correctly structured
 */

const migration = require('../../migrations/20260204055336_add-sub-level-to-songs');

describe('Add sub_level to songs migration', () => {
    let mockPgm;

    beforeEach(() => {
        mockPgm = {
            addColumn: jest.fn(),
            dropColumn: jest.fn(),
            createIndex: jest.fn(),
            dropIndex: jest.fn()
        };
    });

    describe('up migration', () => {
        it('should add sub_level column to songs table', () => {
            migration.up(mockPgm);

            expect(mockPgm.addColumn).toHaveBeenCalledWith('songs', {
                sub_level: {
                    type: 'VARCHAR(10)',
                    default: null,
                    comment: expect.any(String)
                }
            });
        });

        it('should create index on sub_level column', () => {
            migration.up(mockPgm);

            expect(mockPgm.createIndex).toHaveBeenCalledWith('songs', 'sub_level');
        });
    });

    describe('down migration', () => {
        it('should drop the sub_level index', () => {
            migration.down(mockPgm);

            expect(mockPgm.dropIndex).toHaveBeenCalledWith('songs', 'sub_level');
        });

        it('should drop the sub_level column', () => {
            migration.down(mockPgm);

            expect(mockPgm.dropColumn).toHaveBeenCalledWith('songs', 'sub_level');
        });
    });
});
