/**
date: July 5, 2019 ~
@Author: Ji yoon, Park
Title: Server architecture from AWS RDS database using MYSQL platform for GetRest project, Resume section / SOPT_24 Team GetREST.
 */
var express = require('express');
var router = express.Router();
var moment=require('moment');


const utils = require('../../utils/utils');
const statusCode = require('../../utils/statusCode');
const responseMessage = require('../../utils/responseMessage');
const db = require('../../module/pool');
const tokenVerify = require('../../utils/tokenVerify');

/**1. 나의 자소서 작성 전 포트폴리오 전체 불러오기
    METHOD : GET
    url : /resume/history/{questionIdx}
    authorization : token
    입력 : X
    출력 : portfolioIdx, portfolioTitle, portfolioStartDate, portfolioExpireDate, portfolioImg
    */
router.get('/:questionIdx',async(req,res)=>{
    const returnedData=await tokenVerify.isLoggedin(req.headers.authorization,res);
    if(returnedData!=-1){
        if(!req.params.questionIdx){
            res.status(400).send(res.status(400).send(utils.successFalse(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE)));
        }
        else{
            const userIdx=returnedData.userIdx;
            const questionIdx=req.params.questionIdx;
            
            try{
                const historySelectQuery='SELECT portfolioIdx, portfolioTitle, portfolioStartDate, portfolioExpireDate,portfolioImg FROM portfolio WHERE userIdx=?';
                const historySelectResult = await db.queryParam_Arr(historySelectQuery, userIdx);
                
                if(!historySelectResult){
                    res.status(200).send(res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, responseMessage.RESUME_QUESTION_HISTORY_FAIL)));
                }
                else{
                    console.log('historySelectResult');
                    console.log(historySelectResult);
        
                    res.status(200).send(res.status(200).send(utils.successTrue(statusCode.OK,responseMessage.RESUME_QUESTION_HISTORY_SUCCESS,historySelectResult)));
                }
        
            }catch(e){
                console.log(e);
            }
        }
    }
    
});



module.exports = router;