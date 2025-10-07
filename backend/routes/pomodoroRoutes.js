const express = require('express');
const router = express.Router();
const {
  getPomodoroSessions,
  createPomodoroSession,
  completePomodoroSession,
  getAnalytics
} = require('../controllers/pomodoroController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/analytics', getAnalytics);

router.route('/')
  .get(getPomodoroSessions)
  .post(createPomodoroSession);

router.put('/:id/complete', completePomodoroSession);

module.exports = router;
