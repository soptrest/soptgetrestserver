var express = require('express');
var router = express.Router();

const monthQuarter = [0, 3, 6, 9, 12];

router.get('/', async (req, res) => {    
    // const selectPortfolioQuery = `SELECT * FROM portfolio WHERE `
    const nowDate = new Date();
    const currentYear = nowDate.getFullYear();
    let currentMonth = nowDate.getMonth();

    //currentQuarter 1,2,3,4 (각 분기)
    let currentQuarter = 0;
    while(1) {
        currentQuarter++;
        currentMonth < monthQuarter[currentQuarter];
    }

    //시작 년도 및 분기 구하기
    let beginYear, beginQuarter;
    if(currentQuarter == 4) {
        beginYear = currnetYear - 2;
        beginQuarter = 1;
    } else {
        beginYear = currentYear - 3;
        beginQuarter = currentQuarter + 1;
    }

    //beginDate, expireDate
    const beginDate = beginYear + '-' + monthQuarter[beginQuarter];
    

    
});


module.exports = router;
