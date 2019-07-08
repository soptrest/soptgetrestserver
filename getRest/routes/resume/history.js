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

//1. 포트폴리오 전체 조회
router.get('/:userIdx/:questionIdx',async(req,res)=>{
    //user token 추가해야함!!!!!!!!!!!
    if(!req.params.questionIdx || !req.params.userIdx){
        res.status(200).send(res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE)));
    }
    else{
        const userIdx=req.params.userIdx;
        const questionIdx=req.params.questionIdx;
        
        try{
            const historySelectQuery='SELECT portfolioIdx, portfolioTitle, portfolioStartDate, portfolioExpireDate FROM portfolio WHERE userIdx=?';
            const historySelectResult = await db.queryParam_Arr(historySelectQuery, req.params.userIdx);
            
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
});



module.exports = router;