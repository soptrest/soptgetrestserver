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
        const resumeContentInsertQuery = 'INSERT INTO resumeContent(resumeIdx,userIdx,questionIdx,questionContent) VALUES(?,?,?,?)';

        //transaction 처리
        const resumeTransaction = await db.Transaction(async (connection) => {

            //1) 첫번째 transaction -> resume Insert
            const resumeInsertResult = await connection.query(resumeInsertQuery, [resumeInfo.recruitIdx, resumeInfo.userIdx]);
            const resumeIdxSelectQuery='SELECT * from resume WHERE recruitIdx=?';
            const resumeIdxSelectResult=await connection.query(resumeIdxSelectQuery,resumeInfo.recruitIdx);
            console.log(resumeIdxSelectResult[0].resumeIdx);//삽입된 resume의 resumeIdx를 가져옴
            
            const resumeIdxSelectIdxr=resumeIdxSelectResult[0].resumeIdx

            //2) 두번째 transaction -> resumeContent Insert
            const resumeContentInsertResult = await connection.query(resumeContentInsertQuery, [resumeIdxSelectIdxr, resumeInfo.userIdx, resumeInfo.questionIdx, resumeInfo.questionContent]);
            if (!resumeContentInsertResult) {
                console.log('resume Content Insert Result Failed');
            } else {
                console.log('resume Content Insert Result Success');
            }

        });

        if(!resumeTransaction){
            res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, responseMessage.RESUME_SAVE_FAIL));
        }else{
            res.status(200).send(utils.successTrue(statusCode.OK, responseMessage.RESUME_SAVE_SUCCESS));
        }





    }
});





/*3. 나의 자소서 삭제*/
router.delete('/:userIdx/:resumeIdx', async(req,res)=>{
    //null 처리
    if(!req.params.userIdx || !req.params.resumeIdx){
        res.status(400).send(res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE)));
    }else{
        
        const resumeContentDeleteQuery = 'DELETE FROM resumeContent WHERE resumeIdx=?';
        const resumeDeleteQuery = 'DELETE FROM resume WHERE resumeIdx=?';

        //transaction 처리
        const resumeTransaction = await db.Transaction(async (connection) => {

            //1) 첫번째 transaction -> resumeContent Delete
            console.log('1');
            const resumeContentDeleteResult = await connection.query(resumeContentDeleteQuery, req.params.resumeIdx);
            console.log('2');
            //console.log(resumeContentDeleteResult[0].resumeIdx);//삭제된 resume의 resumeIdx를 가져옴
            console.log('3');

            //2) 두번째 transaction -> resume Delete
            const resumeDeleteResult = await connection.query(resumeDeleteQuery, req.params.resumeIdx);
            console.log('4');

            if (!resumeDeleteResult) {
                console.log('resume and resumeContent Delete Failed');
            } else {
                console.log('resume and resumeContent Delete Success');
            }

        });

        if(!resumeTransaction){
            res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, responseMessage.RESUME_DELETE_FAIL));
        }else{
            res.status(200).send(utils.successTrue(statusCode.OK, responseMessage.RESUME_DELETE_SUCCSS));
        }


    }
});



module.exports = router;