/**
date: June 30, 2019 ~
@Author: Ji yoon, Park
Title: Server architecture from AWS RDS database using MYSQL platform for GetRest project, Portfolio section / SOPT_24 Team GetREST.
 */
var express = require('express');
var router = express.Router();

const utils=require('../../utils/utils');
const statusCode=require('../../utils/statusCode');
const responseMessage=require('../../utils/responseMessage');
const db=require('../../module/pool');
const upload=require('../../config/multer');

/* GET home page. */
router.get('/', function(req, res, next) {
res.render('index', { title: 'image' });
});



module.exports = router;
