var express = require('express');
var jsonToCsv = require('convert-json-to-csv');
var cheerio = require('cheerio');
var axios = require('axios');

var db = require('../utils/pool');
var router = express.Router();


/* GET home page. */
router.get('/', (req, res, next) => {
  axios.get('http://www.saramin.co.kr/zf_user/company-info/view?csn=1108153652&popup_yn=y')
  .then(html => {
    const $ = cheerio.load(html.data);
    const bodyList = $(".thumb_company .inner_thumb img")['0']['attribs']['src']
    console.log(bodyList);
  })
})

router.use('/portfolio',require('./portfolio'));
router.use('/resume',require('./resume'));
router.use('/user',require('./user'));
router.use('/recruit',require('./recruit'));
router.use('/saramin', require('./saramin'));

module.exports = router;
