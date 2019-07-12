var express = require('express');
var router = express.Router();

//internal Module
const utils = require('../../utils/utils');
const db = require('../../module/pool');
const statusCode = require('../../utils/statusCode');
const resMessage = require('../../utils/responseMessage');
const encryption = require('../../module/encrytionModule');
const jwt = require("../../config/jwt");

/*
    METHOD : POST
    url : /login
    로그인
    입력 : userEmail, userPassword
    출력 : userIdx, token
*/
router.post('/', async (req, res) => {
    console.log(req.body);
    const userEmail = req.body.userEmail;
    const userPassword = req.body.userPassword;

    const selectUserQuery = `SELECT * FROM user WHERE userEmail = '${userEmail}'`;

    if(!userEmail || !userPassword) {
        res.status(400).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE));
    } else {
        const selectUserResult = await db.queryParam_None(selectUserQuery);
        
        
        // DB내에서 같은 Id가 없을 경우
        if(!selectUserResult) {
            res.status(404).send(utils.successFalse(statusCode.BAD_REQUEST, resMessage.NO_USER));
        } else{
            const hashedPw = await encryption.onlyEncrytion(userPassword, selectUserResult[0].userSalt);
            if(selectUserResult[0].userPassword == hashedPw.hashedPassword){
                
                let nowTimeDate = new Date();
                nowTimeDate.setDate(nowTimeDate.getDate() + 2);
                const timestamp = nowTimeDate.getTime() / 1000;
                const userToken = jwt.sign(selectUserResult[0]);
                const returnData = {    
                    userIdx : selectUserResult[0].userIdx,
                    userName : selectUserResult[0].userName,
                    userToken : userToken.token,
                    timestamp : timestamp
                }
                res.status(200).send(utils.successTrue(statusCode.OK, resMessage.LOGIN_SUCCESS, returnData));
            } else {
                res.status(403).send(utils.successFalse(statusCode.UNAUTHORIZED, resMessage.MISS_MATCH_PW));
            }
        }
    }
});

module.exports = router;
