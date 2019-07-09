var express = require('express');
var cheerio = require('cheerio');
var request = require('sync-request');

var db = require('../module/pool');
var router = express.Router();


/* Test Page */
router.get('/', async (req, res, next) => {
    const q = `SELECT * FROM recruit AS rc JOIN recruitLike AS rl ON rc.recruitIdx = rl.recruitIdx`;
    console.log(await db.queryParam_None(q));
})

router.use('/portfolio',require('./portfolio'));
router.use('/resume',require('./resume'));
router.use('/users',require('./user'));
router.use('/recruit', require('./recruit'));
router.use('/saramin', require('./saramin'));
router.use('/login', require('./login'));
router.use('/home', require('./home'));

module.exports = router;
