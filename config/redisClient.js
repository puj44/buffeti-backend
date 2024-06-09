const  {createClient} = require('redis');
const client = createClient().on('error', err => {
    console.log('Redis Client Error', err)});
    
module.exports =  client;