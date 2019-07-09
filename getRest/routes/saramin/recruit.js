var express = require('express');
const axios = require('axios');
const xmljs = require('xml-js');
const cheerio = require('cheerio');

var router = express.Router();

const db = require('../../module/pool');

function pad(n, width) {
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

router.get('/', async (req, res, next) => {
    /*
        사람인 api 가져오기
        코스닥, 유가증권 상장사만 가져옴
        한 페이지에 100개
    */
    let jobDataArr = [];
    let companyDataArr = [];
    await axios.get('http://api.saramin.co.kr/job-search?bbs_gb=1&stock=kospi+kosdaq&start=0&count=100')
        .then(async response => {
            const xml2json = xmljs.xml2json(response['data'], { compact: true, spaces: 4 });
            const testData = JSON.parse(xml2json);
            const recruitData = testData['job-search']['jobs']['job'];
            //모든 data를 map함수를 통해 for문을 돈다
            recruitData.map(async data => {
                /*
                    MySQL DB 등록을 위한 Column을 외부 Api에서 받아옴
                */
                const recruitPosition = data['position'];
                //공고 시작일
                const dateO = new Date(data['opening-timestamp']["_text"] * 1000);
                dateO.setHours(dateO.getHours());
                //공고 만료일
                const dateE = new Date(data['expiration-timestamp']["_text"] * 1000);
                dateE.setHours(dateE.getHours());
                //공고 게시일
                const dateP = new Date(data['posting-timestamp']["_text"] * 1000);
                //현재 시간
                let dateNow = new Date();
                const btns = dateNow.getTime() - dateP.getTime();

                const shortMonth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                //시간 파싱
                const splitDateO = dateO.toString().split(' ');
                const splitDateE = dateE.toString().split(' ');

                let numMonthO, numMonthE;
                await Promise.all(shortMonth.map((data, iter) => {
                    if(data == splitDateO[1]){
                        numMonthO = pad(iter,2);
                    }
                    if(data == splitDateE[1]){
                        numMonthE = pad(iter,2);
                    }
                }))

                const parsedDateO = splitDateO[3] + '/' + numMonthO + '/' + splitDateO[2] + ' ' + splitDateO[4];
                const parsedDateE = splitDateE[3] + '/' + numMonthE + '/' + splitDateE[2] + ' ' + splitDateE[4];

                //현재시간과 공고 시간의 차이
                const bth = btns / (1000 * 60 * 60);

                /*
                    회사 정보 api 가져오기
                */
                const companyAttr = data['company']['name']['_attributes'];
                let companyData = {
                    companyName: data['company']['name']['_cdata'],
                }
                //url 제공할 경우
                if (companyAttr) {
                    companyData['companyUrl'] = companyAttr['href'];
                }

                /*
                    중복 DB 등록 방지를 위한 최근 등록 1시간 게시물만 등록
                    (현재 시각 - 게시 시간 <= 24시간)만 등록
                */

                let jobData = {
                    recruitJobCategory: recruitPosition["job-category"]["_text"],
                    recruitJobType: recruitPosition["job-type"]["_text"],
                    recruitLocation: recruitPosition["location"]["_cdata"].split(',')[0].split(" &gt; ").join(' '),
                    recruitStartDate: parsedDateO,
                    recruitExpireDate: parsedDateE,
                    recruitTitle: recruitPosition["title"]["_cdata"],
                    recruitSalary: data['salary']['_text'],
                    recruitExperienceLevel: recruitPosition['experience-level']['_text'],
                    recruitRequiredExperienceLevel: recruitPosition['required-education-level']['_text'],
                    recruitURL: data['url']['_text'],
                    recruitLocationCode : recruitPosition['location']['_attributes']['code'],
                    recruitJobCategoryCode : recruitPosition['job-category']['_attributes']['code'],
                    recruitJobTypeCode : recruitPosition['job-type']['_attributes']['code']
                }

                if (bth <= 12) {
                    jobDataArr.push(jobData);
                    companyDataArr.push(companyData);
                }
            })
            
    res.send(recruitData);
        })

    /* 
        api 중 기업 url을 제공하는 데이터에 대하여 company logo 및 url 매핑 및 company DB Insert
        parameter는 companyJson파일
        해당 company DB의 Idx는 jobData Json에 Insert
    */
    await Promise.all(companyDataArr.map(async (data, i) => {
        if (data.companyUrl) {
            await axios.get(data.companyUrl)
                .then((companyHtml) => {
                    const $ = cheerio.load(companyHtml.data);
                    const companyLogo = $('div.title_info > div.thumb_company').find('span.inner_thumb > img').attr('src');
                    data['companyImage'] = companyLogo;
                })
        } else {
            data['companyUrl'] = undefined;
            data['companyImage'] = undefined;
        }
        /*
            Query문의 문자를 Json의 Key-Value 형태를 배열 행태로
            로 변환해서 QueryParam_None 이용
        */
        const arrayCompanyData = Object.keys(data).concat(Object.values(data));
        let companyInsertQuery = `INSERT INTO company (?!, ?!, ?!) VALUES ('?!', '?!', '?!')`

        await Promise.all(arrayCompanyData.map(jsonData => {
            companyInsertQuery = companyInsertQuery.replace('?!', jsonData);
        }));
        console.log(companyInsertQuery);
        const companyResultQuery = await db.queryParam_None(companyInsertQuery);
        // console.log(companyResultQuery);
        jobDataArr[i]['companyIdx'] = await companyResultQuery['insertId'];
    }))

    /*
        위의 function으로 입력된 jobData를 insert
    */
    await Promise.all(jobDataArr.map(async data => {
        const arrayJobData = Object.keys(data).concat(Object.values(data));
        let recruitInsertQuery = `INSERT INTO recruit (?!, ?!, ?!, ?!, ?!, ?!, ?!, ?!, ?!, ?!, ?!, ?!, ?!, ?!) VALUES ('?!', '?!', '?!', '?!', '?!', '?!', '?!', '?!','?!', '?!', '?!', '?!', '?!', '?!')`
        arrayJobData.map(jsonData => {
            recruitInsertQuery = recruitInsertQuery.replace('?!', jsonData);
        });
        const recruitResultQuery = await db.queryParam_None(recruitInsertQuery);
        // console.log(recruitResultQuery);
    }))
    res.end();
});

module.exports = router;