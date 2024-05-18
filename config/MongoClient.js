//Database setup
const  {MongoClient, ServerApiVerison } = require('mongodb');
const client = new MongoClient(process.env.MONGO_URL, { useUnifiedTopology: true });

module.exports = {client};