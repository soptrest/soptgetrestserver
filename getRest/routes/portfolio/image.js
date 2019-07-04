/**
date: June 30, 2019 ~
@Author: Ji yoon, Park
Title: Server architecture from AWS RDS database using MYSQL platform for GetRest project, Portfolio section / SOPT_24 Team GetREST.
 */
var express = require('express');
var router = express.Router();

const utils=require('../../module/utils');
const statusCode=require('../../module/statusCode');
const responseMessage=require('../../module/responseMessage');
const db=require('../../config/pool');
const upload=require('../../config/multer');

/* GET home page. */
router.get('/', function(req, res, next) {
res.render('index', { title: 'image' });
});



module.exports = router;
