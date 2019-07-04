var express = require('express');
const axios = require('axios');
const xmljs = require('xml-js');
const cheerio = require('cheerio');

var router = express.Router();

const db = require('../../utils/pool');

router.get('/', function (req, res, next) {
    //사람인 api 가져오기
    axios.get('http://api.saramin.co.kr/job-search?fields=posting-date+expiration-date&sort=da&start=1&count=3')
        .then(async response => {
            const xml2json = xmljs.xml2json(response['data'], { compact: true, spaces: 4 });
            const testData = JSON.parse(xml2json);
            const recruitData = testData['job-search']['jobs']['job'];
            //모든 data를 map함수를 통해 for문을 돈다
            recruitData.map(async data => {
                const recruitPosition = data['position'];

                //html 크롤링
                await axios.get(data['url']['_text'])
                .then(html => {
                    const $ = cheerio.load(html.data);
                    console.log(html);
                    const companyLogo = $("div.logo img")
                    console.log(companyLogo);
                })
                
                // const companyData = {
                //     companyName : "1",
                //     companyImage : "1",
                //     companyUrl : data["company"][""]
                // }

                var dateO = new Date(data['opening-timestamp']["_text"] * 1000);
                dateO.setHours(dateO.getHours() + 9);
                var dateE = new Date(data['expiration-timestamp']["_text"] * 1000);
                dateE.setHours(dateE.getHours() + 9);
                // axios.get('http://www.saramin.co.kr/zf_user/company-info/view?csn=1108153652&popup_yn=y')
                // .then(html => {
                //   const $ = cheerio.load(html.data);
                //   const bodyList = $(".thumb_company .inner_thumb img")['0']['attribs']['src']
                //   console.log(bodyList);
                // })
                const jobData = {
                    recruitJobCategory: recruitPosition["job-category"]["_text"],
                    recruitJobType: recruitPosition["job-type"]["_text"],
                    recruitLocation: recruitPosition["location"]["_cdata"].split(',')[0].split(" &gt; ").join(' '),
                    recruitStartDate: dateO.toString(),
                    recruitExpireDate: dateE.toString(),
                    // recruitImg : 
                    recruitTitle: recruitPosition["title"]["_cdata"],
                    recruitSalary: data['salary']['_text'],
                    companyIdx : 1,
                    recruitExperienceLevel: recruitPosition['experience-level']['_text'],
                    recruitRequiredExperienceLevel: recruitPosition['required-education-level']['_text'],
                    recruitURL: data['url']['_text']
                }
                const arrayJobData = Object.keys(jobData).concat(Object.values(jobData));
                
                let recruitInsertQuery = `INSERT INTO recruit (?!, ?!, ?!, ?!, ?!, ?!, ?!, ?!, ?!, ?!, ?!) VALUES ('?!', '?!', '?!', '?!', '?!','?!', '?!', '?!', '?!', '?!', '?!')`
                arrayJobData.map(data => {
                    recruitInsertQuery = recruitInsertQuery.replace('?!', data);
                })
                console.log(recruitInsertQuery);
                // const recruitResultQuery = await db.queryParam_None(recruitInsertQuery);
                // await console.log(recruitResultQuery);
                // console.log(jobData);

                // const recruitCompanyURL = data['company']['name']['_attributes'];
                // if(recruitCompanyURL) {
                //   recruitCompanyURL['href']
                // }
                // const recruitCompanyName = data['company']['name']['_cdata'];
                // console.log(recruitCompanyName);


            })
            // console.log(recruitPosition);



            res.send(testData['job-search']['jobs']['job']);
            res.end();
        })
});

module.exports = router;