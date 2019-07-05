/**
date: July 3, 2019
@Author: Ji yoon, Park
Title: Server architecture from AWS RDS database using MYSQL platform for GetRest project, Portfolio section / SOPT_24 Team GetREST.
 */

var express = require('express');
var router = express.Router();

router.use('/portfolio',require('./portfolio'));
router.use('/image',require('./image'));


module.exports = router;
