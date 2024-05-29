const  {createClient} = require('redis');
const client = createClient({
    prefix:"dev_"
}).on('error', err => {
    console.log('Redis Client Error', err)})
module.exports =  client;