/**
date: July 6, 2019 ~
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

/* GET home page. */
router.get('/:recruitIdx', async (req, res) => {
    const userIdx = req.params.userIdx;
    const recruitIdx = req.params.recruitIdx;

    /*Params NULL check*/
    if (!req.params.recruitIdx) {
        res.status(200).send(res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE)));
    } else {
        console.log('recruitIdx----------------');
        console.log(req.params.recruitIdx);
        var questionArray = new Array();

        //dbInsert
        try {
            const questionSelectQuery = 'SELECT questionNum,questionTitle FROM question WHERE recruitIdx=?';
            const questionSelectResult = await db.queryParam_Parse(questionSelectQuery, req.params.recruitIdx);

            if (!questionSelectResult) {
                res.status(200).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.RESUME_QUESTION_READ_FAIL));
            } else {
                res.status(200).send(utils.successTrue(statusCode.OK, responseMessage.RESUME_QUESTION_READ_SUCCESSS, questionSelectResult));
            }
        } catch (e) {
            console.log(e);
        }


    }
});





module.exports = router;