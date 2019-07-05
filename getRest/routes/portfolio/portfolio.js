/**
date: June 30, 2019 ~
@Author: Ji yoon, Park
Title: Server architecture from AWS RDS database using MYSQL platform for GetRest project, Portfolio section / SOPT_24 Team GetREST.
 */
var express = require('express');
var router = express.Router();
var moment=require('moment');

const utils = require('../../utils/utils');
const statusCode = require('../../utils/statusCode');
const responseMessage = require('../../utils/responseMessage');
const db = require('../../module/pool');
const upload = require('../../config/multer');

router.get('/',async(req,res)=>{
    res.render('index', { title: 'portfolio' });
});

    /**1. 포트폴리오 작성 */
router.post('/',upload.fields([{name:'portfolioImg'}]),async(req,res)=>{
    if(!req.body.portfolioTitle || !req.body.portfolioBody||!req.body.portfolioCategory ||!req.body.portfolioTag){
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
            portfolioImg:null,
            portfolioTag:req.body.portfolioTag
        }

        /*tag parsing
        var tag=req.body.tag; //tag string
        var tags=new Array(); //tag array
        var tagCount=(tag.split(',')).length; //tag 개수
        for(i=0;i<tagCount;i++){
        tags[i]=tag.split(',')[i];
        }*/
        
        //portfolioImg parsing
        const portfolioImg=req.files.portfolioImg[0].location;
        console.log('portfolioImg',portfolioImg);
        portfolioInfo.portfolioImg=portfolioImg;

        //db insert
            try{
                const portfolioInsertQuery='INSERT INTO portfolio(portfolioTitle,portfolioBody,portfolioStartDate,portfolioExpireDate,userIdx,portfolioImg,portfolioCategory,portfolioTag) VALUES(?,?,?,?,?,?,?,?)';
                const portfolioInsertResult = await db.queryParam_Arr(portfolioInsertQuery, [portfolioInfo.portfolioTitle,portfolioInfo.portfolioBody,portfolioInfo.portfolioStartDate,portfolioInfo.portfolioExpireDate,req.body.userIdx,portfolioInfo.portfolioImg,portfolioInfo.portfolioCategory,portfolioInfo.portfolioTag]);
                        if(!portfolioInsertResult){
                            res.status(200).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.PORTFOLIO_SAVE_FAIL));
                                        
                        }else{
                            res.status(200).send(utils.successTrue(statusCode.OK,responseMessage.PORTFOLIO_SAVE_SUCCESS));
                        }
                        
            }catch(e){
                console.log(e);
            }

        
    }
    });

    /*2. 포트폴리오 전체 조회*/
    router.get('/:userIdx',async(req,res)=>{
        //console.log(req.params.userIdx);

        var userIdx=req.params.userIdx;
        const portfolioSelectQuery='SELECT portfolioIdx,portfolioTitle,portfolioStartDate,portfolioExpireDate,portfolioCategory,portfolioImg FROM portfolio';
        const portfolioSelectResult=await db.queryParam_Parse(portfolioSelectQuery,userIdx);

        if(!portfolioSelectResult){
            res.status(200).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.PORTFOLIO_READ_FAIL));
        }
        else{
            const portfolioSelectInfo=portfolioSelectResult;
            res.status(200).send(utils.successTrue(statusCode.OK,responseMessage.PORTFOLIO_READ_SUCCESS,portfolioSelectInfo));
        }
    });

    /**3. 포트폴리오 상세 조회 */
    router.get('/:userIdx/:portfolioIdx',async(req,res)=>{
       // console.log(req.params.userIdx);
       // console.log(req.params.portfolioIdx);
        var userIdx=req.params.userIdx;
        var portfolioIdx=req.params.portfolioIdx;
        
        //if token 하고 userIdx 하고 일치 시

        //db Query
        const portfolioDetailSelectQuery='SELECT portfolioTitle,portfolioStartDate,portfolioExpireDate,portfolioBody,portfolioTag FROM portfolio WHERE portfolioIdx=?';
        const portfolioDetailSelectResult=await db.queryParam_Parse(portfolioDetailSelectQuery,portfolioIdx);

        if(!portfolioDetailSelectResult){
            res.status(200).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.PORTFOLIO_DETAIL_READ_FAIL));
        }   
        else{
            res.status(200).send(utils.successTrue(statusCode.OK,responseMessage.PORTFOLIO_DETAIL_READ_SUCCESS,portfolioDetailSelectResult));
        }

    });

     /**4. 포트폴리오 삭제 */
    router.delete('/:portfolioIdx',async(req,res)=>{
        //***************************/user token 확인_추가해야함
        if(!req.params.portfolioIdx){
            res.status(200).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.PORTFOLIO_DELETE_FAIL_PARAMS));
        }
        else{
            const portfolioIdx=req.params.portfolioIdx;
            const portfolioSearchQuery='SELECT * FROM portfolio WHERE portfolioIdx=?';
            const portfolioSearchResult=await db.queryParam_Parse(portfolioSearchQuery,portfolioIdx);
            console.log('searchResult affectedRows');
            console.log(portfolioSearchResult.length);

            if(portfolioSearchResult.length==0){ //db에 일치하는 portfolioIdx가 없으면
                res.status(200).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.PORTFOLIO_DELETE_FAIL_NOT_EXIST));
            }
            else{ //db에 일치하는 portfolioIdx가 있으면
                const portfolioDeleteQuery='DELETE FROM portfolio WHERE portfolioIdx=?';
                const portfolioDeleteResult=await db.queryParam_Parse(portfolioDeleteQuery,portfolioIdx);
                
                if(!portfolioDeleteResult){
                    res.status(200).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.PORTFOLIO_DELETE_FAIL));
                }
                else{
                    res.status(200).send(utils.successTrue(statusCode.OK,responseMessage.PORTFOLIO_DELETE_SUCCESS)); 
                }
            }
            
        }
        
    });
    /**5. 포트폴리오 수정 */
    router.put('/:portfolioIdx',upload.fields([{name:'portfolioImg'}]),async(req,res)=>{
        //***************************/user token 확인_추가해야함

        if(!req.params.portfolioIdx){ //수정할 portfolioIdx 미입력시
            res.status(200).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.PORTFOLIO_DELETE_FAIL_PARAMS));
        }
        else{
            const portfolioIdx=req.params.portfolioIdx;
            const portfolioSearchQuery='SELECT * FROM portfolio WHERE portfolioIdx=?';
            const portfolioSearchResult=await db.queryParam_Parse(portfolioSearchQuery,portfolioIdx);

            if(portfolioSearchResult.length==0){ //db에 일치하는 portfolioIdx가 없으면
                res.status(200).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.PORTFOLIO_DELETE_FAIL_NOT_EXIST));
            }
            else{  //db에 일치하는 portfolioIdx가 있으면
                if(!req.body.portfolioTitle || !req.body.portfolioStartDate || !req.body.portfolioExpireDate || !req.body.portfolioCategory){
                    res.status(200).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.PORTFOLIO_DELETE_FAIL_PARAMS));  
                }
                const portfolioInfo={
                    portfolioTitle:req.body.portfolioTitle, //0
                    portfolioStartDate:req.body.portfolioStartDate, //1
                    portfolioExpireDate:req.body.portfolioExpireDate, //2
                    portfolioBody:req.body.portfolioBody, //3
                    portfolioCategory:req.body.portfolioCategory, //4
                    userIdx:req.body.userIdx, //5
                    portfolioImg:null, //6
                    portfolioTag:req.body.portfolioTag //7
                }
                //portfolioImg parsing
                const portfolioImg=req.files.portfolioImg[0].location;
                portfolioInfo.portfolioImg=portfolioImg;

                const portfolioUpdateQuery='UPDATE portfolio SET portfolioTitle=?,portfolioStartDate=?,portfolioExpireDate=?,portfolioBody=?,portfolioCategory=?,userIdx=?,portfolioImg=?,portfolioTag=? WHERE portfolioIdx=?';
                const portfolioUpdateResult=await db.queryParam_Parse(portfolioUpdateQuery,[portfolioInfo.portfolioTitle,portfolioInfo.portfolioStartDate,portfolioInfo.portfolioExpireDate,portfolioInfo.portfolioBody,portfolioInfo.portfolioCategory,portfolioInfo.userIdx,portfolioInfo.portfolioImg,portfolioInfo.portfolioTag,portfolioIdx]);
                
                if(!portfolioUpdateResult){
                    res.status(200).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.PORTFOLIO_UPDATE_FAIL));
                }
                else{
                    res.status(200).send(utils.successTrue(statusCode.OK,responseMessage.PORTFOLIO_UPDATE_SUCCESS)); 
                }
            }
        }
    });

    module.exports = router;