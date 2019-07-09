/**
date: July 5, 2019 ~
@Author: Ji yoon, Park
Title: Server architecture from AWS RDS database using MYSQL platform for GetRest project, Resume section / SOPT_24 Team GetREST.
 */
var express = require('express');
var router = express.Router();
var moment = require('moment');
const utils = require('../../utils/utils');
const statusCode = require('../../utils/statusCode');
const responseMessage = require('../../utils/responseMessage');
const db = require('../../module/pool');
const upload = require('../../config/multer');

/*1. 나의 자소서 작성*/
router.post('/', async (req, res) => {
    if (!req.body.userIdx || !req.body.recruitIdx || !req.body.questionNum || !req.body.questionContent) {
        res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
    } else {
        const resumeInfo = {
            userIdx: req.body.userIdx,
            recruitIdx: req.body.recruitIdx,
            questionNum: req.body.questionNum,
            questionContent: req.body.questionContent,
            questionIdx: null
        }
        //questionIdx SELECT
        //recruitIdx와 questionNum 기반으로 questionIdx 가져옴 
        const resumeInsertQuery = 'INSERT INTO resume(recruitIdx,userIdx) VALUES(?,?)';
        const questionIdxSelectQuery = 'SELECT questionIdx FROM question WHERE recruitIdx = ? AND questionNum = ?';
        const questionIdxSelectResult = await db.queryParam_Parse(questionIdxSelectQuery, [resumeInfo.recruitIdx, resumeInfo.questionNum]);

        resumeInfo.questionIdx = questionIdxSelectResult[0].questionIdx;
        const resumeContentInsertQuery = 'INSERT INTO resumeContent(resumeIdx,userIdx,questionIdx,questionContent) VALUES(?,?,?,?)';

        //transaction 처리
        const resumeTransaction = await db.Transaction(async (connection) => {

            //1) 첫번째 transaction -> resume Insert
            const resumeInsertResult = await connection.query(resumeInsertQuery, [resumeInfo.recruitIdx, resumeInfo.userIdx]);
            const resumeIdxSelectQuery = 'SELECT * from resume WHERE recruitIdx=?';
            const resumeIdxSelectResult = await connection.query(resumeIdxSelectQuery, resumeInfo.recruitIdx);
            console.log(resumeIdxSelectResult[0].resumeIdx); //삽입된 resume의 resumeIdx를 가져옴

            const resumeIdxSelectIdxr = resumeIdxSelectResult[0].resumeIdx

            //2) 두번째 transaction -> resumeContent Insert
            const resumeContentInsertResult = await connection.query(resumeContentInsertQuery, [resumeIdxSelectIdxr, resumeInfo.userIdx, resumeInfo.questionIdx, resumeInfo.questionContent]);
            if (!resumeContentInsertResult) {
                console.log('resume Content Insert Result Failed');
            } else {
                console.log('resume Content Insert Result Success');
            }

        });

        if (!resumeTransaction) {
            res.status(401).send(utils.successFalse(statusCode.BAD_REQUEST, responseMessage.RESUME_SAVE_FAIL));
        } else {
            res.status(200).send(utils.successTrue(statusCode.OK, responseMessage.RESUME_SAVE_SUCCESS));
        }





    }
});

/*2. 나의 자소서 전체 조회*/
router.get('/:userIdx', async (req, res) => {
    //1) leftdate, 2) companyName, 3) recruitJobType, 4) expirecheck, 5) recruitIdx 리턴해주자~

    if (!req.params.userIdx) {
        res.status(400).send(res.status(400).send(utils.successFalse(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE)));
    } else {
        const myresumeInfo = {
            leftDate: null,
            companyName: null,
            recruitJobType: null,
            expireCheck: null,
            recruitIdx: null
        }
        //recruit와 resume JOIN 해서 recruitIdx, companyIdx 가져옴
        const myresumeSelectQuery = 'SELECT resume.recruitIdx, companyIdx, recruitJobType, recruitStartDate, recruitExpireDate FROM resume JOIN recruit ON resume.recruitIdx=recruit.recruitIdx WHERE resume.userIdx=?';
        const myresumeSelectResult = await db.queryParam_Parse(myresumeSelectQuery, req.params.userIdx);
        if (!myresumeSelectResult) {
            res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, responseMessage.RESUME_WHOLE_SELECT_FAIL));
        } else {
            var myresumeInfosend = Array();

            for (var i = 0; i < myresumeSelectResult.length; i++) {


                const companyIdx = myresumeSelectResult[i].companyIdx;
                console.log('companyIdxxxxxxx');
                console.log(companyIdx);
                myresumeInfo.recruitIdx = myresumeSelectResult[i].recruitIdx; //5)
                const recruitStartDate = myresumeSelectResult[i].recruitStartDate;
                const recruitExpireDate = myresumeSelectResult[i].recruitExpireDate;
                myresumeInfo.recruitJobType = myresumeSelectResult[i].recruitJobType; //3)

                const companyNameSelectQuery = 'SELECT companyName FROM company WHERE companyIdx=?';
                const companyNameSelectResult = await db.queryParam_Parse(companyNameSelectQuery, companyIdx);
                myresumeInfo.companyName = companyNameSelectResult[0].companyName; //2) 


                //1) leftDate, 4) expireCheck
                var dayDiff = moment(recruitExpireDate, "YYYY.MM.DD").fromNow();
                if (dayDiff.split(' ')[2] == 'hours') { //마감 당일
                    myresumeInfo.leftDate = 0;
                    myresumeInfo.expireCheck = true;
                    console.log('마감 당일');
                    console.log(myresumeInfo.leftDate);
                } else if (dayDiff.split(' ')[2] == 'ago') { //마감종료
                    myresumeInfo.leftDate = 0;
                    myresumeInfo.expireCheck = true;
                    console.log('마감 종료')

                } else {
                    console.log('남은 일자: ');
                    myresumeInfo.leftDate = Number(dayDiff.split(' ')[1]); //1) leftDate
                    myresumeInfo.expireCheck = false;
                    console.log(myresumeInfo.leftDate);
                }

                myresumeSelectResult[i].leftDate = myresumeInfo.leftDate;
                myresumeSelectResult[i].companyName = myresumeInfo.companyName;
                myresumeSelectResult[i].expireCheck = myresumeInfo.expireCheck;

                myresumeInfosend.push(myresumeSelectResult[i]);

            }
            res.status(200).send(utils.successTrue(statusCode.OK, responseMessage.RESUME_WHOLE_SELECT_SUCCESS, myresumeInfosend));

        }
    }
});

/**3. 나의 자소서 상세 조회*/
router.get('/:userIdx/:resumeIdx/:questionNum',async(req,res)=>{
    //1) questionTitle, 3) recruitJobType, 4) resumeContent 리턴해주자~
    if(!req.params.userIdx || !req.params.resumeIdx){
        res.status(400).send(res.status(400).send(utils.successFalse(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE)));      
    }
    else{
        //1) questionTitle, questionIdx select ->resumeIdx로 recruitIdx 먼저 찾아와서 recruitIdx로 questionTitle, idx조회
        const recruitIdxSelectQuery='SELECT recruitIdx FROM resume WHERE resumeIdx=? AND userIdx=?';
        const recruitIdxSelectResult=await db.queryParam_Parse(recruitIdxSelectQuery, [req.params.resumeIdx, req.params.userIdx]);

        const recruitIdx=recruitIdxSelectResult[0].recruitIdx;
        
        const questionSelectQuery='SELECT questionIdx,questionTitle from question WHERE recruitIdx=? AND questionNum=?';
        const questionSelectResult=await db.queryParam_Arr(questionSelectQuery,[recruitIdx,req.params.questionNum]); 

        if(!questionSelectResult){
            res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, responseMessage.RESUME_DETAIL_SELECT_FAIL));
        }
        else{
            //보낼 data packet
            const resumeDetailSend={
                questionTitle:null,
                questionIdx:null,
                recruitJobType:null,
                resumeContent:null
            }
            //questionTitle 찾기
            const questionIdx=questionSelectResult[0].questionIdx;
            const questionTitle=questionSelectResult[0].questionTitle; // 1) questionTitle
            resumeDetailSend.questionIdx=questionIdx;
            resumeDetailSend.questionTitle=questionTitle;

            //recruitJobType 찾기
            const recruitJobTypeSelectQuery='SELECT recruitJobType FROM recruit WHERE recruitIdx=?';
            const recruitJobTypeSelectResult=await db.queryParam_Parse(recruitJobTypeSelectQuery,recruitIdx);
            
            resumeDetailSend.recruitJobType=recruitJobTypeSelectResult[0].recruitJobType; //2) recruitJobType
            
            //3) questionContent 찾기 (resumeContent)
            const questionContentSelectQuery='SELECT questionContent FROM resumeContent WHERE resumeIdx=? AND questionIdx=?';
            const questionContentSelectResult=await db.queryParam_Arr(questionContentSelectQuery,[req.params.resumeIdx, questionIdx]);
            resumeDetailSend.resumeContent=questionContentSelectResult[0].questionContent;

            res.status(200).send(utils.successTrue(statusCode.OK,responseMessage.RESUME_DETAIL_SELECT_SUCCESS, resumeDetailSend));
        }
    }
});
/*4. 나의 자소서 수정*/
router.put('/:userIdx/:resumeIdx/:recruitIdx/:questionNum', async (req, res) => {
    //null 처리
    if (!req.params.userIdx || !req.params.resumeIdx || !req.params.questionNum || !req.body.questionContent || !req.params.recruitIdx) {
        res.status(400).send(res.status(400).send(utils.successFalse(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE)));
    } else {
        const resumeInfo = {
            userIdx: req.params.userIdx,
            resumeIdx: req.params.resumeIdx,
            recruitIdx: req.params.recruitIdx,
            questionNum: req.params.questionNum,
            questionContent: req.body.questionContent,
            questionIdx: null
        }

        //questionIdx SELECT
        //rec ruitIdx와 questionNum 기반으로 questionIdx 가져옴 
        const questionIdxSelectQuery = 'SELECT questionIdx FROM question WHERE recruitIdx = ? AND questionNum = ?';
        const questionIdxSelectResult = await db.queryParam_Parse(questionIdxSelectQuery, [resumeInfo.recruitIdx, resumeInfo.questionNum]);
        resumeInfo.questionIdx = questionIdxSelectResult[0].questionIdx;
        const resumeContentUpdateQuery = 'UPDATE resumeContent SET questionIdx=?,questionContent=? WHERE resumeIdx=?';
        const resumeUpdateQuery = 'UPDATE resume SET resumeIdx=?, recruitIdx=?, userIdx=? WHERE resumeIdx=?';

        //transaction 처리
        const resumeUpdateTransaction = await db.Transaction(async (connection) => {

            //1) 첫번째 transaction -> resumeContent Update
            const resumeContentUpdateResult = await connection.query(resumeContentUpdateQuery, [resumeInfo.questionIdx, resumeInfo.questionContent, resumeInfo.resumeIdx]);

            //2) 두번째 transaction -> resume Update
            const resumeUpdateResult = await connection.query(resumeUpdateQuery, [resumeInfo.resumeIdx, resumeInfo.recruitIdx, resumeInfo.userIdx, resumeInfo.resumeIdx]);
            if (!resumeUpdateResult) {
                console.log('resume and resumeContent Update Failed');
            } else {
                console.log('resume and resumeContent Update Successed');
            }

        });

        if (!resumeUpdateTransaction) {
            res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, responseMessage.RESUME_UPDATE_FAIL));
        } else {
            res.status(200).send(utils.successTrue(statusCode.OK, responseMessage.RESUME_UPDATE_SUCCESS));
        }


    }
});

/*5. 나의 자소서 삭제*/
router.delete('/:userIdx/:resumeIdx', async (req, res) => {
    //null 처리
    if (!req.params.userIdx || !req.params.resumeIdx) {
        res.status(400).send(res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE)));
    } else {

        const resumeContentDeleteQuery = 'DELETE FROM resumeContent WHERE resumeIdx=?';
        const resumeDeleteQuery = 'DELETE FROM resume WHERE resumeIdx=?';

        //transaction 처리
        const resumeTransaction = await db.Transaction(async (connection) => {

            //1) 첫번째 transaction -> resumeContent Delete
            const resumeContentDeleteResult = await connection.query(resumeContentDeleteQuery, req.params.resumeIdx);

            //2) 두번째 transaction -> resume Delete
            const resumeDeleteResult = await connection.query(resumeDeleteQuery, req.params.resumeIdx);

            if (!resumeDeleteResult) {
                console.log('resume and resumeContent Delete Failed');
            } else {
                console.log('resume and resumeContent Delete Success');
            }

        });

        if (!resumeTransaction) {
            res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, responseMessage.RESUME_DELETE_FAIL));
        } else {
            res.status(200).send(utils.successTrue(statusCode.OK, responseMessage.RESUME_DELETE_SUCCESS));
        }


    }
});



module.exports = router;