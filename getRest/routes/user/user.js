var express = require('express');
var router = express.Router();

//internal modules
const statusCode = require('../../utils/statusCode');
const resMessage = require('../../utils/responseMessage');
const utils = require('../../utils/utils');
const db = require('../../module/pool');
const jsontosql = require('../../module/jsontosql');
const encryption = require('../../module/encrytionModule');
const jwt = require("../../config/jwt");
const tokenVerify = require("../../utils/tokenVerify")

//external modules

/*
    METHOD : POST
    url : /users
    회원가입
    입력 : userName, userPassword, userPassword
    출력 : 
*/

router.post('/', async (req, res) => {
    let userData = {
        userName: req.body.userName,
        userEmail: req.body.userEmail,
        userPassword: req.body.userPassword
    }

    const selectQuery = `SELECT * FROM user WHERE userEmail = '${userData.userEmail}'`;
    const insertQuery = `INSERT INTO user (?!, ?!, ?!, ?!) VALUES ('?!', '?!', '?!', '?!')`;

    /* 
        null Value 확인
    */
    if (!userData.userName || !userData.userEmail || !userData.userPassword) {
        res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        const emailCheck = await db.queryParam_None(selectQuery);
        if (!(emailCheck[0] == undefined)) {
            res.status(400).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.ALREADY_USER));
        } else {
            const userEncryption = await encryption.encrytion(userData['userPassword']);
            userData['userPassword'] = userEncryption['hashedPassword'];
            userData['userSalt'] = userEncryption['salt'];

            const insertRecruitQuery = await jsontosql.parseJson(insertQuery, userData);
            const insertResult = await db.queryParam_None(insertRecruitQuery);

            if ((insertResult == undefined)) {
                res.status(400).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
            } else {
                res.status(201).send(utils.successTrue(statusCode.CREATED, resMessage.CREATED_USER));
            }
        }
    }
});

/*
    METHOD : DELETE
    url : /users
    회원정보 삭제
    Authorization : token
    입력 : userPassword
    출력 : 
*/
router.delete('/', async (req, res) => {
    const returnedData = await tokenVerify.isLoggedin(req.headers.authorization, res);
    const userData = req.body;
    console.log(returnedData);
    if(!userData.userPassword) {
        res.status(400).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else if (returnedData != -1) {
        const selectUserQuery = `SELECT * FROM user WHERE userIdx = '${returnedData.userIdx}'`;
        const selectUserResult = await db.queryParam_None(selectUserQuery);
        const hashedPw = await encryption.onlyEncrytion(userData.userPassword, selectUserResult[0].userSalt);

        //DB안의 비밀번호와 요청 비번 검증
        if (selectUserResult[0].userPassword == hashedPw.hashedPassword) {
            const deleteUserQuery = `UPDATE user SET userName = '', userEmail =  '', userPassword = '', userSalt = '' WHERE userIdx = ${selectUserResult[0].userIdx}`;
            await db.queryParam_None(deleteUserQuery);
            res.status(200).send(utils.successTrue(statusCode.OK, resMessage.DELETE_USER));
        } else {
            res.status(403).send(utils.successFalse(statusCode.FORBIDDEN, resMessage.MISS_MATCH_PW));
        }
    }
})

/*
    METHOD : PUT
    url : /users/info
    회원정보 수정
    Authorization : token
    입력 : userName
    출력 : 
*/
router.put('/info', async (req, res) => {
    const returnedData = await tokenVerify.isLoggedin(req.headers.authorization, res);
    const userData = req.body;

    //토큰 만료 상태
    if(!userData.userName) {
        res.status(400).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else if (returnedData != -1) {
        const selectUserQuery = `SELECT * FROM user WHERE userIdx = '${returnedData.userIdx}'`;
        const selectUserResult = await db.queryParam_None(selectUserQuery);
        const updateUserQuery = `UPDATE user SET userName = '${userData.userName}' WHERE userIdx = ${selectUserResult[0].userIdx}`;
        await db.queryParam_None(updateUserQuery);
        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.UPDATE_USER));
    }
})

/*
    METHOD : PUT
    url : /users/password
    회원정보 수정
    Authorization : token
    입력 : userPassword
    출력 : 
*/
router.put('/password', async (req, res) => {
    const returnedData = await tokenVerify.isLoggedin(req.headers.authorization, res);
    const userData = req.body;

    //비밀번호 미입력
    if(!userData.userPassword) {
        res.status(400).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else if (returnedData != -1) {
        const userEncryption = await encryption.encrytion(userData['userPassword']);
        const updateUserQuery = `UPDATE user SET userPassword = '${userEncryption['hashedPassword']}', userSalt = '${userEncryption['salt']}' WHERE userIdx = ${returnedData.userIdx}`;
        await db.queryParam_None(updateUserQuery);
        res.status(200).send(utils.successTrue(statusCode.OK, resMessage.UPDATE_USER));
    }
})

module.exports = router;
