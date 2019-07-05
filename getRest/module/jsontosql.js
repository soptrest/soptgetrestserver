const jsontosql = {
    parseJson : async (...args) => {
        let query = args[0];
        let json = args[1];
        
        const arrayData = Object.keys(json).concat(Object.values(json));

        await Promise.all(arrayData.map(jsonData => {
            query = query.replace('?!', jsonData);
        }));

        return query;
    }
}

module.exports = jsontosql;