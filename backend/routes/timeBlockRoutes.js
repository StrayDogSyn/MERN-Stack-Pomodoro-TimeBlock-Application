const express = require('express');
const router = express.Router();
const {
  getTimeBlocks,
  createTimeBlock,
  updateTimeBlock,
  deleteTimeBlock
} = require('../controllers/timeBlockController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getTimeBlocks)
  .post(createTimeBlock);

router.route('/:id')
  .put(updateTimeBlock)
  .delete(deleteTimeBlock);

module.exports = router;
