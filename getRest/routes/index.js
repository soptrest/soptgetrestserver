var express = require('express');
var cheerio = require('cheerio');
var request = require('sync-request');

var db = require('../module/pool');
var router = express.Router();


/* GET home page. */
router.get('/', (req, res, next) => {
  const url = 'http://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=36521907&utm_source=job-search-api&utm_medium=api&utm_campaign=saramin-job-search-api'
  const response = request('GET', url);
  const $ = cheerio.load(response.getBody());
  
  const $content = $('div#content').children('div.wrap_jview')
  console.log($content.children());
  
})

router.use('/portfolio',require('./portfolio'));
router.use('/resume',require('./resume'));
router.use('/users',require('./user'));
router.use('/recruit',require('./recruit'));
router.use('/saramin', require('./saramin'));
router.use('/login', require('./login'));

module.exports = router;
