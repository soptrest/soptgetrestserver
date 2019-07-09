var express = require('express');
var router = express.Router();

const tokenVerify = require('../../utils/tokenVerify');
const db = require('../../config/pool');
const utils = require('../../utils/utils');
const resMessage = require('../../utils/responseMessage');
const statusCode = require('../../utils/statusCode');
const recruitArrParsing = require('../../module/recruitArrParsingModule');

/*
    METHOD : GET
    url : /recruit/filter
    채용 공고 필터 조회
    Authorization : token
    입력 : date, recruitJobType, recruitLocation, recruitJobCategory
    출력 : recruitIdx, companyName, companyImage, recruitJobCategory, recruitExpireDate
*/

router.get('/filter', async (req, res) => {
    const returnedData = await tokenVerify.isLoggedin(req.headers.authorization, res);
    if (returnedData != -1) {
        const searchDate = req.body.date;
        const query = req.query;
        //req date 형식(YYYY.MM.DD)

        const splitSearchDate = searchDate.split('.');
        const queryStartDate = splitSearchDate[0] + ' ' + splitSearchDate[1] + ' ' + splitSearchDate[2] + ' 00:00:00';
        const queryEndDate = splitSearchDate[0] + ' ' + splitSearchDate[1] + ' ' + splitSearchDate[2] + ' 23:59:59';

        let selectRecruitQuery = `SELECT * FROM recruit WHERE recruitStartDate <= '${queryEndDate}' AND recruitExpireDate >= '${queryStartDate}'`
        if(query.recruitJobType) {
            selectRecruitQuery += ` AND recruitJobTypeCode = '${query.recruitJobType}'`;
        }
        if (query.recruitLocation) {
            selectRecruitQuery += ` AND FLOOR(recruitLocationCode/1000) = '${query.recruitLocation/1000}'`;
        }
        if (query.recruitJobCategory) {
            selectRecruitQuery += ` AND FLOOR(recruitJobCategoryCode/100) = '${query.recruitJobCategory}'`;
        }
        
        const selectRecruitResult = await db.queryParam_None(selectRecruitQuery);
        let recruitArr = recruitArrParsing.insertRecruitArr(selectRecruitResult);
        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.RECRUIT_FILTER_SUCCESS, recruitArr));
    } 
});

/*
    METHOD : GET
    url : /recruit/like
    채용 공고 즐겨찾기 조회
    Authorization : token
    입력 : date
    출력 : recruitIdx, companyName, companyImage, recruitJobCategory, recruitExpireDate
*/

router.get('/like', async (req, res) => {
    const returnedData = await tokenVerify.isLoggedin(req.headers.authorization, res);
    if (returnedData != -1) {
        const searchDate = req.body.date;
        //req date 형식(YYYY.MM.DD)

        const splitSearchDate = searchDate.split('.');
        const queryStartDate = splitSearchDate[0] + ' ' + splitSearchDate[1] + ' ' + splitSearchDate[2] + ' 00:00:00';
        const queryEndDate = splitSearchDate[0] + ' ' + splitSearchDate[1] + ' ' + splitSearchDate[2] + ' 23:59:59';

        let selectRecruitQuery = `SELECT * FROM recruit JOIN recruitLike ON recruit.recruitIdx = recruitLike.recruitIdx WHERE recruitStartDate <= '${queryEndDate}' AND recruitExpireDate >= '${queryStartDate}'`
        
        const selectRecruitResult = await db.queryParam_None(selectRecruitQuery);
        let recruitArr = await recruitArrParsing.insertRecruitArr(selectRecruitResult);
    
        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.RECRUIT_LIKE_SELECT_SUCCESS, recruitArr));
    } 
});

/*
    METHOD : POST
    url : /recruit/like
    채용 공고 좋아요
    Authorization : token
    입력 : recruitIdx
    출력 : recruitLikeOn
*/

router.post('/like', async (req, res) => {
    const returnedData = await tokenVerify.isLoggedin(req.headers.authorization, res);
    const recruitIdx = req.body.recruitIdx;

    if (returnedData != -1) {
        const recruitLikeSelectQuery = `SELECT * FROM recruitLike WHERE userIdx = '${returnedData.userIdx}' AND recruitIdx = '${recruitIdx}'`
        const recruitLikeSelectResult = await db.queryParam_None(recruitLikeSelectQuery);
        
        let likeState;
        if(!recruitLikeSelectResult[0]) {
            const recruitLikeInsertQuery = `INSERT INTO recruitLike (userIdx, recruitIdx, recruitLikeOn) VALUES ('${returnedData.userIdx}','${recruitIdx}', '1')`;
            await db.queryParam_None(recruitLikeInsertQuery);
            likeState = 1;
        } else if(recruitLikeSelectResult[0]['recruitLikeOn'] == 1) {
            const recruitLikeOffQuery = `UPDATE recruitLike SET recruitLikeOn = '0' WHERE userIdx = '${returnedData.userIdx}' AND recruitIdx = '${recruitIdx}'`;
            await db.queryParam_None(recruitLikeOffQuery);
            likeState = 0;
        } else if(recruitLikeSelectResult[0]['recruitLikeOn'] == 0) {
            const recruitLikeOnQuery = `UPDATE recruitLike SET recruitLikeOn = '1' WHERE userIdx = '${returnedData.userIdx}' AND recruitIdx = '${recruitIdx}'`;
            await db.queryParam_None(recruitLikeOnQuery);
            likeState = 1;
        }
        const jsonObject = {
            likeState : likeState
        }
        res.status(201).send(utils.successTrue(statusCode.CREATED, resMessage.RECRUIT_LIKE_SUCCESS ,jsonObject))
    }
});

/*
    METHOD : GET
    url : /recruit/detail/{recruitIdx}
    채용 공고 상세보기
    Authorization : token
    입력 : recruitIdx
    출력 : companyName, recruitJobCategory, recruitExpireDate, recruitExperienceLevel, 
    recruitRequiredExperienceLevel, recruitJobType, recruitSalary, recruitLocation
*/

router.get('/detail/:recruitIdx', async (req, res) => {
    const returnedData = await tokenVerify.isLoggedin(req.headers.authorization, res);
    if (returnedData != -1) {
        const reqRecruitIdx = req.params.recruitIdx; 
        const selectRecruitQuery = `SELECT * FROM recruit JOIN company ON recruit.companyIdx = company.companyIdx WHERE recruitIdx = '${reqRecruitIdx}'`
        const selectRecruitDetailResult = await db.queryParam_None(selectRecruitQuery);

        const splitResultDate = selectRecruitDetailResult[0]['recruitExpireDate'].split(' ');
        const splitResultTime = splitResultDate[3].split(':');
        const convertedExpireDate = '~' + splitResultDate[1] + '월 ' + splitResultDate[2] + '일 ' + splitResultTime[0] + '시 ' + splitResultTime[1] + '분'


        const jobDetailJson = {
            companyName : selectRecruitDetailResult[0].companyName,
            companyImage : selectRecruitDetailResult[0].companyImage,
            recruitJobCategory : selectRecruitDetailResult[0].recruitJobCategory,
            recruitExpireDate : convertedExpireDate,
            recruitExperienceLevel : selectRecruitDetailResult[0].recruitExperienceLevel,
            recruitRequiredExperienceLevel : selectRecruitDetailResult[0].recruitRequiredExperienceLevel,
            recruitJobType : selectRecruitDetailResult[0].recruitJobType,
            recruitSalary : selectRecruitDetailResult[0].recruitSalary,
            recruitLocation : selectRecruitDetailResult[0].recruitLocation,
            recruitURL : selectRecruitDetailResult[0].recruitURL
        }
        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.RECRUIT_DETAIL_SUCCEESS , jobDetailJson))
    }
})

/*
    METHOD : GET
    url : /recruit
    채용 공고 전체 조회 
    Authorization : token
    입력 : date
    출력 : recruitIdx, companyName, companyImage, recruitJobCategory, recruitExpireDate
*/

router.get('/', async (req, res) => {
    const returnedData = await tokenVerify.isLoggedin(req.headers.authorization, res);
    if (returnedData != -1) {
        const searchDate = req.body.date;
        //req date 형식(YYYY.MM.DD)

        const splitSearchDate = searchDate.split('.');
        const queryStartDate = splitSearchDate[0] + ' ' + splitSearchDate[1] + ' ' + splitSearchDate[2] + ' 00:00:00';
        const queryEndDate = splitSearchDate[0] + ' ' + splitSearchDate[1] + ' ' + splitSearchDate[2] + ' 23:59:59';

        const selectRecruitQuery = `SELECT * FROM recruit WHERE recruitStartDate <= '${queryEndDate}' AND recruitExpireDate >= '${queryStartDate}'`
        const selectRecruitResult = await db.queryParam_None(selectRecruitQuery);

        let recruitArr = await recruitArrParsing.insertRecruitArr(selectRecruitResult);
        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.RECRUIT_ALL_SUCCESS, recruitArr));
    } 
});


module.exports = router;
