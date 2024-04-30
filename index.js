const express = require('express');
const PORT = process.env.PORT || 3001;
require('dotenv').config()
const app = express();

const bodyParser = require('body-parser');
const cors=require('cors');
  app.use((req, res, next) => {
    res.append('Access-Control-Allow-Origin', ['*']);
    res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.append('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
app.use(bodyParser.json());
app.use(express.urlencoded({extended:false}));
app.use(cors());

app.get('/api', (req, res) => {
    return res.status(200).send('Working');
});

app.listen(PORT, () => {console.log("Server started.")});