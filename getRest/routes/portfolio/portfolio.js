/**
date: June 30, 2019 ~
@Author: Ji yoon, Park
Title: Server architecture from AWS RDS database using MYSQL platform for GetRest project, Portfolio section / SOPT_24 Team GetREST.
 */
var express = require('express');
var router = express.Router();
var moment=require('moment');

const utils=require('../../module/utils');
const statusCode=require('../../module/statusCode');
const responseMessage=require('../../module/responseMessage');
const db=require('../../config/pool');
const upload=require('../../config/multer');

router.get('/',async(req,res)=>{
    res.render('index', { title: 'portfolio' });
});

/*1. 포트폴리오 입력*/
router.post('/',upload.fields([{name:'portfolioImg'}]),async(req,res)=>{
    if(!req.body.portfolioTitle || !req.body.portfolioBody||!req.body.portfolioCategory ||!req.body.tag){
        res.status(200).send(utils.successFalse(statusCode.BAD_REQUEST,responseMessage.NULL_VALUE));
    }
    else{
        //portfolio information parsing
        const portfolioInfo={
            portfolioTitle:req.body.portfolioTitle,
            portfolioStartDate:req.body.portfolioStartDate,
            portfolioExpireDate:req.body.portfolioExpireDate,
            portfolioBody:req.body.portfolioBody,
            portfolioCategory:req.body.portfolioCategory,
            userIdx:req.body.userIdx,
            portfolioImg:null
        }
        console.log(portfolioInfo.portfolioTitle+'\n');
        console.log(portfolioInfo.portfolioBody+'\n');
        console.log(portfolioInfo.portfolioCategory+'\n');
        console.log(portfolioInfo.userIdx+'\n');
        console.log(portfolioInfo.portfolioStartDate+'\n');
        console.log(portfolioInfo.portfolioExpireDate+'\n');
        
        //tag parsing
        var tag=req.body.tag; //tag string
        var tags=new Array(); //tag array
        var count=(tag.split(',')).length; //tag 개수
        for(i=0;i<count;i++){
        tags[i]=tag.split(',')[i];
        }
        
        //portfolioImg parsing
        const portfolioImg=req.files.portfolioImg[0].location;
        console.log('portfoSlioImg',portfolioImg);
        portfolioInfo.portfolioImg=portfolioImg;

        //db insert
            try{
                const portfolioInsertQuery='INSERT INTO portfolio(portfolioTitle,portfolioBody,portfolioStartDate,portfolioExpireDate,userIdx,portfolioImg,portfolioCategory) VALUES(?,?,?,?,?,?,?)';
                const portfolioInsertResult = await db.queryParam_Arr(portfolioInsertQuery, [portfolioInfo.portfolioTitle,portfolioInfo.portfolioBody,portfolioInfo.portfolioStartDate,portfolioInfo.portfolioExpireDate,req.body.userIdx,portfolioInfo.portfolioImg,portfolioInfo.portfolioCategory]);
                
                    if(!portfolioInsertResult){
                        res.status(200).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.PORTFOLIO_SAVE_FAIL));
                    }
                    else{
                        res.status(200).send(utils.successTrue(statusCode.OK,responseMessage.PORTFOLIO_SAVE_SUCCESS));
                    }
            }catch(e){
                console.log(e);
            }
            
        
    }
    });
    module.exports = router;