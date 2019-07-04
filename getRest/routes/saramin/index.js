var express = require('express');
var router = express.Router();

/* GET home page. */
router.use('/recruit', require('./recruit'));


module.exports = router;
