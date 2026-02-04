const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');
const { requireAdmin } = require('../middleware/auth');

router.get('/songs', songController.getSongs);

// Admin only: Update songs
router.put('/songs/:id/sub_level', requireAdmin, songController.updateSubLevel);
router.put('/songs/:id/classification', requireAdmin, songController.updateClassification);

module.exports = router;
