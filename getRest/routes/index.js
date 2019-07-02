var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.use('/portfolio',require('./portfolio'));
router.use('/resume',require('./resume'));
router.use('/user',require('./user'));
router.use('/recruit',require('./recruit'));

module.exports = router;
