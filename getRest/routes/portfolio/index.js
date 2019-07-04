/**
date: July 3, 2019
@Author: Ji yoon, Park
Title: Server architecture from AWS RDS database using MYSQL platform for GetRest project, Portfolio section / SOPT_24 Team GetREST.
 */

var express = require('express');
var router = express.Router();
var moment=require('moment');

const utils=require('../../module/utils');
const statusCode=require('../../module/statusCode');
const responseMessage=require('../../module/responseMessage');
const db=require('../../utils/pool');

router.use('/portfolio',require('./portfolio'));
router.use('/image',require('./image'));


module.exports = router;
