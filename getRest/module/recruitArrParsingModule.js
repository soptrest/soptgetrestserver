const db = require('./pool');

const recruitArrParsing = {
    insertRecruitArr : async (dbResult) => {
        let resultArr = [];
        await Promise.all(dbResult.map(async result => {
            
            const selectRecruitQuery = `SELECT * FROM company WHERE companyIdx = ${result['companyIdx']}`
            const selectCompanyResult = await db.queryParam_None(selectRecruitQuery);
            const splitResultDate = result['recruitExpireDate'].split(' ');
            const splitSeperateDate = splitResultDate[0].split('/');
            const splitResultTime = splitResultDate[1].split(':');
            const convertedExpireDate = '~' + splitSeperateDate[1] + '월 ' + splitSeperateDate[2] + '일 ' + splitResultTime[0] + '시 ' + splitResultTime[1] + '분'
            
            let parsedRecruitJson = {
                recruitIdx: result['recruitIdx'],
                companyName: selectCompanyResult[0]['companyName'],
                companyImage: selectCompanyResult[0]['companyImage'], //없을 경우 undefined (string 형태로)
                recruitJobCategory: result['recruitJobCategory'],
                recruitExpireDate: convertedExpireDate
            }
            resultArr.push(parsedRecruitJson);
        }))
        return resultArr;
    }
}

module.exports = recruitArrParsing;