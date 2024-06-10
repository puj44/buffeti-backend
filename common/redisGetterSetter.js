const client = require('../config/redisClient');
const prefix = process.env.ENV === "PRODUCTION" ? "prod_" : "dev_"
async function get(key, parseData = false) {
    if(!client.isOpen){
        await client.connect()
    }
    let data = await client.get((prefix+key));

    if(parseData && data){
        data = await JSON.parse(data);
    }
    
    return data;

}

async function set (key,data, stringify = false){
    if(!client.isOpen){
        await client.connect()
    }
    const value = stringify ? JSON.stringify(data) : data;
    await client.set((prefix+key),value);
    
    return true;
}

async function remove(key){
    if(!client.isOpen){
        await client.connect()
    }
    await client.del((prefix+key));
    
    return true;
}

module.exports.get = get;
module.exports.set = set;
module.exports.remove = remove;