var express = require('express');
var router = express.Router();

const tokenVerify = require('../../utils/tokenVerify');
const db = require('../../config/pool');
const utils = require('../../utils/utils');
const resMessage = require('../../utils/responseMessage');
const statusCode = require('../../utils/statusCode');

/*
    METHOD : GET
    url : /recruit/filter
    채용 공고 필터 조회
    Authorization : token
    입력 : date, recruitJobType, recruitLocation, recruitJobCategory
    출력 : recruitIdx, companyName, companyImage, recruitJobCategory, recruitExpireDate, recruitExperienceLevel, 
    recruitRequiredExperienceLevel, recruitLocation, recruitURL
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

        let recruitArr = [];
        await Promise.all(selectRecruitResult.map(async result => {
            const selectRecruitQuery = `SELECT * FROM company WHERE companyIdx = ${result['companyIdx']}`
            const selectCompanyResult = await db.queryParam_None(selectRecruitQuery);
            const splitResultDate = result['recruitExpireDate'].split(' ');
            const splitResultTime = splitResultDate[3].split(':');
            const convertedExpireDate = '~' + splitResultDate[1] + '월 ' + splitResultDate[2] + '일 ' + splitResultTime[0] + '시 ' + splitResultTime[1] + '분'

            let parsedRecruitJson = {
                recruitIdx: result['recruitIdx'],
                companyName: selectCompanyResult[0]['companyName'],
                companyImage: selectCompanyResult[0]['companyImage'], //없을 경우 undefined (string 형태로)
                recruitJobCategory: result['recruitJobCategory'],
                recruitExpireDate: convertedExpireDate
            }
            recruitArr.push(parsedRecruitJson);
        }))
        
        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.RECRUIT_ALL_SUCCESS, recruitArr));
    } 
});

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

        let recruitArr = [];
        await Promise.all(selectRecruitResult.map(async result => {
            const selectRecruitQuery = `SELECT * FROM company WHERE companyIdx = ${result['companyIdx']}`
            const selectCompanyResult = await db.queryParam_None(selectRecruitQuery);
            const splitResultDate = result['recruitExpireDate'].split(' ');
            const splitResultTime = splitResultDate[3].split(':');
            const convertedExpireDate = '~' + splitResultDate[1] + '월 ' + splitResultDate[2] + '일 ' + splitResultTime[0] + '시 ' + splitResultTime[1] + '분'

            let parsedRecruitJson = {
                recruitIdx: result['recruitIdx'],
                companyName: selectCompanyResult[0]['companyName'],
                companyImage: selectCompanyResult[0]['companyImage'], //없을 경우 undefined (string 형태로)
                recruitJobCategory: result['recruitJobCategory'],
                recruitExpireDate: convertedExpireDate
            }
            recruitArr.push(parsedRecruitJson);
        }))
        
        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.RECRUIT_ALL_SUCCESS, recruitArr));
    } 
});


module.exports = router;
