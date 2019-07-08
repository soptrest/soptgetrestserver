var express = require('express');
var router = express.Router();


router.use('/resume',require('./resume'));
router.use('/question',require('./question'));
router.use('/history',require('./history'));

module.exports = router;
