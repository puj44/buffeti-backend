const express = require('express');
require('dotenv').config()
const PORT = process.env.PORT || 3001;
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


app.listen(PORT, (err) => { if(err) console.log(err); console.log("Server started on PORT:",PORT)});