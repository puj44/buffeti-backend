const client = require('../config/redisClient');

async function get(key, parseData = false) {

    await client.connect();

    let data = await client.get(key);
    if(parseData && data){
        data = await JSON.parse(data);
    }
    await client.disconnect();
    return data;

}

async function set (key,data, stringify = false){
    await client.connect();
    const value = stringify ? JSON.stringify(data) : data;

    await client.set(key,value);

    await client.disconnect();
    return;
}

async function remove(key){
    await client.connect();

    await client.del(key);

    await client.disconnect();
    return;
}

module.exports.get = get;
module.exports.set = set;
module.exports.remove = remove;