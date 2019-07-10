var express = require('express');
var router = express.Router();

// schedule.scheduleJob('59 59 23 * * *', () => {
//     axios.get('http://52.78.119.153:4000/saramin/recruit').then(() =>{
//         console.log('업데이트 스케쥴 - 매일 23:59:59에 실행');
//     }) 
// });


/* Test Page */
router.get('/', async (req, res, next) => {
    // const dateO = new Date(data['opening-timestamp']["_text"] * 1000);
    // dateO.setHours(dateO.getHours());
    //현재 시간
    let dateNow = new Date();
    
    let dateP = new Date(1562732054 * 1000);
    const btns = dateNow.getHours() - dateP.getHours();
    console.log(btns);
})

router.use('/portfolio',require('./portfolio'));
router.use('/resume',require('./resume'));
router.use('/users',require('./user'));
router.use('/recruit', require('./recruit'));
router.use('/saramin', require('./saramin'));
router.use('/login', require('./login'));
router.use('/home', require('./home'));

module.exports = router;
