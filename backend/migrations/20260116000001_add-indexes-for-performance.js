exports.up = (pgm) => {
  pgm.createIndex('user_lamps', ['user_id', 'song_id'], { unique: true });
  pgm.createIndex('lamp_history', ['user_lamp_id']);
};

exports.down = (pgm) => {
  pgm.dropIndex('user_lamps', ['user_id', 'song_id']);
  pgm.dropIndex('lamp_history', ['user_lamp_id']);
};