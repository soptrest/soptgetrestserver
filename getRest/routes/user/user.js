var express = require('express');
var router = express.Router();

//internal modules
const statusCode = require('../../utils/statusCode');
const resMessage = require('../../utils/responseMessage');
const utils = require('../../utils/utils');
const db = require('../../module/pool');
const jsontosql = require('../../module/jsontosql');
const encrytion = require('../../module/encrytionModule');

//external modules


router.post('/', async (req, res) => {
    let userData = {
        userName : req.body.userName,
        userEmail : req.body.userEmail,
        userPassword : req.body.userPassword
    }

    const selectQuery = `SELECT * FROM user WHERE userEmail = ${userData.userEmail}`;
    const insertQuery = `INSERT INTO user (?!, ?!, ?!, ?!) VALUES ('?!', '?!', '?!', '?!')`;

    /* 
        null Value 확인
    */
    if (!userData.userName || !userData.userEmail || !userData.userPassword) {
        res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        const emailCheck = await db.queryParam_None(selectQuery);
        if(!(emailCheck == undefined)) {
            res.status(400).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.ALREADY_USER));
        } else {
            const userEncryption = await encrytion.encrytion(userData['userPassword']);
            userData['userPassword'] = userEncryption['hashedPassword'];
            userData['userSalt'] = userEncryption['salt'];
            

            const insertRecruitQuery = await jsontosql.parseJson(insertQuery, userData);
            console.log(insertRecruitQuery);
            const insertResult = await db.queryParam_None(insertRecruitQuery);
            
            if(!(insertResult == undefined)){
                res.status(400).send(utils.successFalse(statusCode.BAD_REQUEST,resMessage.NULL_VALUE));
            } else {
                res.status(201).send(utils.successTrue(statusCode.CREATED, resMessage.CREATED_USER));
            }
        }
    }
   

});

module.exports = router;
