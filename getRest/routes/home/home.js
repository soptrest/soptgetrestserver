var express = require('express');
var router = express.Router();

const tokenVerify = require('../../utils/tokenVerify');
const db = require('../../module/pool');
const utils = require('../../utils/utils');
const resMessage = require('../../utils/responseMessage');
const statusCode = require('../../utils/statusCode');

const monthQuarter = [0, 3, 6, 9, 12];

/*
    METHOD : GET
    url : /home/portfolio
    홈 포트폴리오 조회
    authorization : token
    입력 : date
    출력 : portfolioIdx, portfolioTitle, portfolioStartDate, portfolioExpireDate
*/

router.get('/portfolio', async (req, res) => {
    const returnedData = await tokenVerify.isLoggedin(req.headers.authorization, res);
    const homeDate = req.body.date;
    const dateArr = homeDate.split('.');
    let nowQuarter = dateArr[1]; //현재 날짜 분기

    const homeQuery = `SELECT * FROM portfolio WHERE userIdx = ${returnedData.userIdx}`;
    const homeResult = await db.queryParam_None(homeQuery);

    let startMonth, endMonth;
    if (nowQuarter == 1) {
        startMonth = '01';
        endMonth = '03';
    } else if (nowQuarter == 2) {
        startMonth = '04';
        endMonth = '06';
    } else if (nowQuarter == 3) {
        startMonth = '07';
        endMonth = '09';
    } else {
        startMonth = '10';
        endMonth = '12';
    }
    let requestStartDate = dateArr[0] + '.' + startMonth;
    let requestEndDate = dateArr[0] + '.' + endMonth;

    let portfolioArr = [];

    homeResult.map(result => {
        const portfolioJson = {
            portfolioIdx : result.portfolioIdx,
            portfolioTitle : result.portfolioTitle,
            portfolioStartDate : result.portfolioStartDate,
            portfolioExpireDate : result.portfolioExpireDate
        }
        if(requestStartDate <= result.portfolioStartDate && result.portfolioStartDate <= requestEndDate){
            portfolioArr.push(portfolioJson);
        } else if (requestStartDate <= result.portfolioExpireDate && result.portfolioExpireDate <= requestEndDate) {
            portfolioArr.push(portfolioJson);
        } else if (result.portfolioStartDate <= requestStartDate && requestEndDate <= result.portfolioExpireDate) {
            portfolioArr.push(portfolioJson);
        }
    })

    console.log(portfolioArr);
    if(!portfolioArr.length){
        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.NULL_VALUE, portfolioArr));
    } else {
        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.HOME_PORTFOLIO_SUCCESS, portfolioArr));
    }

})

/*
    METHOD : GET
    url : /home
    홈 그래프
    authorization : token
    입력 : 
    출력 : date, count
*/

router.get('/', async (req, res) => {    
    const returnedData = await tokenVerify.isLoggedin(req.headers.authorization, res);
    
    //유저 모든 포트폴리오 (오름차순)
    const selectPortfolioAllQuery = `SELECT * FROM portfolio WHERE userIdx = ${returnedData.userIdx} ORDER BY portfolioStartDate`;
    const selectPortfolioAllResult = await db.queryParam_None(selectPortfolioAllQuery);
    
    //유저 마지막 포트폴리오 (내림차순)
    const selectPortfolioLastQuery = `SELECT * FROM portfolio WHERE userIdx = ${returnedData.userIdx} ORDER BY portfolioExpireDate DESC LIMIT 1`;
    const selectPortfolioLastResult = await db.queryParam_None(selectPortfolioLastQuery);
    // console.log(selectPortfolioAllResult);
    // console.log('--------------------------------------');
    // console.log(selectPortfolioLastResult);

    const firstStartDate = selectPortfolioAllResult[0].portfolioStartDate.split('.');
    const firstStartYear = Number(firstStartDate[0]);
    const firstStartMonth = Number(firstStartDate[1]);

    const lastExpireDate = selectPortfolioLastResult[0].portfolioExpireDate.split('.');
    const lastExpireYear = Number(lastExpireDate[0]);
    const lastExpireMonth = Number(lastExpireDate[1]); 
    //currentQuarter 1,2,3,4 (각 분기)
    let firstQuarter = 0; //현재 날짜 분기
    let lastQuarter = 0;
    while(1) {
        firstQuarter++;
        if(firstStartMonth <= monthQuarter[firstQuarter]){
            break;
        }
    }
    while(1) {
        lastQuarter++;
        if(lastExpireMonth <= monthQuarter[lastQuarter]){
            break;
        }
    }
    
    //firstStartYear, firstStartMonth, firstQuarter
    //lastExpireYear, lastExpireMonth, lastQuarter
    //ex) const nowDate = beginYear + '.' + ( monthQuarter[beginQuarter - 1] + 1 ) ;
    let graphYear = firstStartYear; //그래프 처음 연도
    let graphMonth = monthQuarter[firstQuarter - 1] + 1; //그래프 처음 달 (1,4,7,10)
    let graphQuarter = firstQuarter;
    let graphCountArr = [];
    
    while(graphYear < lastExpireYear || (graphYear == lastExpireYear && graphQuarter <= lastQuarter)) {
        let graphCount = 0;
        
        //월 앞에 붙는 0을 추가 or 제거 (string)
        let zeroStringStart = '0';
        let zeroStringEnd = '0';
        if (graphMonth >= 10) {
            zeroStringStart = '';
        }
        if (graphMonth + 2 >= 10) {
            zeroStringEnd = '';
        }

        const graphStartDate = graphYear + '.' + zeroStringStart + graphMonth;
        const graphEndDate = graphYear + '.' + zeroStringEnd + (graphMonth + 2);
        const graphQuarterDate = graphYear + '.' + graphQuarter;

        selectPortfolioAllResult.map(result => {
            if(graphStartDate <= result.portfolioStartDate && result.portfolioStartDate <= graphEndDate){
                graphCount++;
            } else if (graphStartDate <= result.portfolioExpireDate && result.portfolioExpireDate <= graphEndDate) {
                graphCount++;
            } else if (result.portfolioStartDate <= graphStartDate && graphEndDate <= result.portfolioExpireDate) {
                graphCount++;
            }
        })
        let graphJson = {
            date : graphQuarterDate,
            count : graphCount
        }
        graphCountArr.push(graphJson);
        graphMonth += 3;
        graphQuarter += 1;

        if(graphMonth > 12 && graphQuarter > 4) {
            graphMonth -= 12;
            graphQuarter -= 4;
            graphYear += 1;
        }
    }
    
    console.log(graphCountArr);

    if(!graphCountArr.length){
        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.NULL_VALUE, graphCountArr));
    } else {
        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.HOME_GRAPH_SUCCESS, graphCountArr));
    }
});


module.exports = router;
