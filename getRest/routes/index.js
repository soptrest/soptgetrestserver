var express = require('express');
const axios = require('axios');
const schedule = require('node-schedule'); 

var db = require('../module/pool');
var router = express.Router();

schedule.scheduleJob('59 59 23 * * *', () => {
    axios.get(' http://52.78.119.153:4000/saramin/recruit').then(() =>{
        console.log('업데이트 스케쥴 - 매일 23:59:59에 실행');
    }) 
});

/* Test Page */
// router.get('/', async (req, res, next) => {
//     const q = `SELECT * FROM recruit AS rc JOIN recruitLike AS rl ON rc.recruitIdx = rl.recruitIdx`;
//     console.log(await db.queryParam_None(q));
// })

router.use('/portfolio',require('./portfolio'));
router.use('/resume',require('./resume'));
router.use('/users',require('./user'));
router.use('/recruit', require('./recruit'));
router.use('/saramin', require('./saramin'));
router.use('/login', require('./login'));
router.use('/home', require('./home'));

module.exports = router;
