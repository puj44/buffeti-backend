const  {createClient} = require('redis');
const client = createClient({
    password:process.env.REDIS_PASSWORD ?? null
}).on('error', err => {
    console.log('Redis Client Error', err)});
    
module.exports =  client;