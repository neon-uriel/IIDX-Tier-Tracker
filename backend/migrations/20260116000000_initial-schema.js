/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.sql(`
        -- Create users table
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            google_id VARCHAR(255) UNIQUE NOT NULL,
            display_name VARCHAR(255),
            email VARCHAR(255) UNIQUE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create songs table
        CREATE TABLE songs (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            genre VARCHAR(255),
            artist VARCHAR(255),
            version INT NOT NULL,
            level INT NOT NULL,
            difficulty VARCHAR(10) NOT NULL,
            UNIQUE (title, difficulty)
        );

        -- Create user_lamps table
        CREATE TABLE user_lamps (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            song_id INT REFERENCES songs(id) ON DELETE CASCADE,
            lamp VARCHAR(20) NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE (user_id, song_id)
        );

        -- Create lamp_history table
        CREATE TABLE lamp_history (
            id SERIAL PRIMARY KEY,
            user_lamp_id INT REFERENCES user_lamps(id) ON DELETE CASCADE,
            lamp VARCHAR(20) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);
};

exports.down = pgm => {
    pgm.sql(`
        DROP TABLE lamp_history;
        DROP TABLE user_lamps;
        DROP TABLE songs;
        DROP TABLE users;
    `);
};
