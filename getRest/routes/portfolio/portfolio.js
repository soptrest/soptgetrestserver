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
const tokenVerify = require('../../utils/tokenVerify');


    /**1. 포트폴리오 작성
    METHOD : POST
    url : /portfolio/portfolio
    authorization : token
    입력 : portfolioTitle, portfolioBody, portfolioCategory, portfolioTag, portfolioStartDate, portfolioExpireDate
    출력 : portfolioIdx
    */
router.post('/',upload.fields([{name:'portfolioImg'}]),async(req,res)=>{
    const returnedData=await tokenVerify.isLoggedin(req.headers.authorization,res);
    console.log(req.body)
    console.log(req.body);

    if(returnedData!=-1){

        if(!req.body.portfolioTitle || !req.body.portfolioBody){
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
            userIdx:returnedData.userIdx,
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
                const portfolioInsertResult = await db.queryParam_Arr(portfolioInsertQuery, [portfolioInfo.portfolioTitle,portfolioInfo.portfolioBody,portfolioInfo.portfolioStartDate,portfolioInfo.portfolioExpireDate,portfolioInfo.userIdx,portfolioInfo.portfolioImg,portfolioInfo.portfolioCategory,portfolioInfo.portfolioTag]);
                        if(!portfolioInsertResult){
                            res.status(200).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.PORTFOLIO_SAVE_FAIL));
                                        
                        }else{
                            const portfolioSendInfo={
                                portfolioIdx:null
                            }
                            portfolioSendInfo.portfolioIdx=portfolioInsertResult.insertId;
                            res.status(200).send(utils.successTrue(statusCode.OK,responseMessage.PORTFOLIO_SAVE_SUCCESS,portfolioSendInfo));
                            console.log(res);
                        }
                        
            }catch(e){
                console.log(e);
            }

        
    }
}
    });

    /*2. 포트폴리오 전체 조회
    METHOD : GET
    url : /portfolio/portfolio
    authorization : token
    입력 : X
    출력 : portfolioIdx,portfolioTitle,portfolioStartDate, portfolioExpireDate, portfolioCategory, portfolioImg, portfolioTag
    */
    router.get('/',async(req,res)=>{
        const returnedData=await tokenVerify.isLoggedin(req.headers.authorization,res);
        if(returnedData!=-1){

        var userIdx=returnedData.userIdx;
        const portfolioSelectQuery='SELECT portfolioIdx,portfolioTitle,portfolioStartDate,portfolioExpireDate,portfolioCategory,portfolioImg,portfolioTag FROM portfolio WHERE userIdx=?';
        const portfolioSelectResult=await db.queryParam_Parse(portfolioSelectQuery,userIdx);

        if(!portfolioSelectResult){
            res.status(200).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.PORTFOLIO_READ_FAIL));
        }
        else{
            const portfolioSelectInfo=portfolioSelectResult;
            res.status(200).send(utils.successTrue(statusCode.OK,responseMessage.PORTFOLIO_READ_SUCCESS,portfolioSelectInfo));
        }
    }
    });

    /**3. 포트폴리오 상세 조회
    METHOD : GET
    url : /portfolio/portfolio/{portfolioIdx}
    authorization : token
    입력 : X
    출력 : portfolioTitle,portfolioStartDate, portfolioExpireDate, portfolioCategory, portfolioImg, portfolioTag, portfolioBody
     */
    router.get('/:portfolioIdx',async(req,res)=>{
    const returnedData=await tokenVerify.isLoggedin(req.headers.authorization,res);
    if(returnedData!=-1){
        var userIdx=returnedData.userIdx;
        var portfolioIdx=req.params.portfolioIdx;
        
        
        //db Query
        const portfolioDetailSelectQuery='SELECT portfolioTitle,portfolioStartDate,portfolioExpireDate,portfolioBody,portfolioTag,portfolioCategory,portfolioImg FROM portfolio WHERE portfolioIdx=?';
        const portfolioDetailSelectResult=await db.queryParam_Parse(portfolioDetailSelectQuery,portfolioIdx);

        if(!portfolioDetailSelectResult){
            res.status(500).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.PORTFOLIO_DETAIL_READ_FAIL));
        }   
        else{
            res.status(200).send(utils.successTrue(statusCode.OK,responseMessage.PORTFOLIO_DETAIL_READ_SUCCESS,portfolioDetailSelectResult));
        }
    }
    });

    /**4. 포트폴리오 삭제 
      * METHOD : DELETE
    url : /portfolio/portfolio/{portfolioIdx}
    authorization : token
    입력 : X
    출력 : ResponseMessage
     */
    router.delete('/:portfolioIdx',async(req,res)=>{
        const returnedData=await tokenVerify.isLoggedin(req.headers.authorization,res);
        if(returnedData!=-1){
            console.log(req);
        if(!req.params.portfolioIdx){
            res.status(500).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.PORTFOLIO_DELETE_FAIL_PARAMS));
        }
        else{
            const portfolioIdx=req.params.portfolioIdx;
            const portfolioSearchQuery='SELECT * FROM portfolio WHERE portfolioIdx=?';
            const portfolioSearchResult=await db.queryParam_Parse(portfolioSearchQuery,portfolioIdx);
            console.log('searchResult affectedRows');
            console.log(portfolioSearchResult.length);

            if(!portfolioSearchResult){ //db에 일치하는 portfolioIdx가 없으면
                res.status(200).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.PORTFOLIO_DELETE_FAIL_NOT_EXIST));
            }
            else{ //db에 일치하는 portfolioIdx가 있으면
                const portfolioDeleteQuery='DELETE FROM portfolio WHERE portfolioIdx=?';
                const portfolioDeleteResult=await db.queryParam_Parse(portfolioDeleteQuery,portfolioIdx);
                
                if(!portfolioDeleteResult){
                    res.status(500).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.PORTFOLIO_DELETE_FAIL));
                }
                else{
                    res.status(200).send(utils.successTrue(statusCode.OK,responseMessage.PORTFOLIO_DELETE_SUCCESS)); 
                }
            }
            
        }
    }
    
    });
    /**5. 포트폴리오 수정 
    METHOD : PUT
    url : /portfolio/portfolio/{portfolioIdx}
    authorization : token
    입력 : portfolioTitle,portfolioStartDate, portfolioExpireDate, portfolioCategory, portfolioImg, portfolioTag, portfolioBody
    출력 : ResponseMessage
     */
    router.put('/:portfolioIdx',upload.fields([{name:'portfolioImg'}]),async(req,res)=>{
        console.log('req.body-------');
        console.log(req.body);
        console.log('req.image---------');
        console.log(req.files.portfolioImg[0].location);

        const returnedData=await tokenVerify.isLoggedin(req.headers.authorization,res);
        if(returnedData!=-1){
        if(!req.params.portfolioIdx){ //수정할 portfolioIdx 미입력시
            res.status(200).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.PORTFOLIO_DELETE_FAIL_PARAMS));
        }
        else{
            const portfolioIdx=req.params.portfolioIdx;
            const portfolioSearchQuery='SELECT * FROM portfolio WHERE portfolioIdx=?';
            const portfolioSearchResult=await db.queryParam_Parse(portfolioSearchQuery,portfolioIdx);

            if(!portfolioSearchResult){ //db에 일치하는 portfolioIdx가 없으면
                res.status(200).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.PORTFOLIO_DELETE_FAIL_NOT_EXIST));
            }
            else{  //db에 일치하는 portfolioIdx가 있으면
                if(!req.body.portfolioTitle ){
                    res.status(500).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.PORTFOLIO_DELETE_FAIL_PARAMS));  
                }
                const portfolioInfo={
                    portfolioTitle:req.body.portfolioTitle, //0
                    portfolioStartDate:req.body.portfolioStartDate, //1
                    portfolioExpireDate:req.body.portfolioExpireDate, //2
                    portfolioBody:req.body.portfolioBody, //3
                    portfolioCategory:req.body.portfolioCategory, //4
                    userIdx:returnedData.userIdx, //5
                    portfolioImg:null, //6
                    portfolioTag:req.body.portfolioTag //7
                }
                //portfolioImg parsing
                const portfolioImg=req.files.portfolioImg[0].location;
                
                portfolioInfo.portfolioImg=portfolioImg;

                const portfolioUpdateQuery='UPDATE portfolio SET portfolioTitle=?,portfolioStartDate=?,portfolioExpireDate=?,portfolioBody=?,portfolioCategory=?,userIdx=?,portfolioImg=?,portfolioTag=? WHERE portfolioIdx=?';
                const portfolioUpdateResult=await db.queryParam_Parse(portfolioUpdateQuery,[portfolioInfo.portfolioTitle,portfolioInfo.portfolioStartDate,portfolioInfo.portfolioExpireDate,portfolioInfo.portfolioBody,portfolioInfo.portfolioCategory,portfolioInfo.userIdx,portfolioInfo.portfolioImg,portfolioInfo.portfolioTag,portfolioIdx]);
                
                if(!portfolioUpdateResult){
                    res.status(500).send(utils.successFalse(statusCode.INTERNAL_SERVER_ERROR, responseMessage.PORTFOLIO_UPDATE_FAIL));
                }
                else{
                    res.status(200).send(utils.successTrue(statusCode.OK,responseMessage.PORTFOLIO_UPDATE_SUCCESS)); 
                }
            }
        }
    }
    });

    module.exports = router;