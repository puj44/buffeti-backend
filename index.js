const express = require('express');
require('dotenv').config()
const app = express();
const bodyParser = require('body-parser');
const cors=require('cors');
const corsOptions = {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    credentials: true
  }
app.use(bodyParser.json());
app.use(express.urlencoded({extended:false}));
app.use(cors(corsOptions));
app.set("trust proxy", true);

app.get('/', (req, res) => {
    return res.status(200).send('Working');
});

app.listen(process.env.PORT || 3000, () => {console.log("Server started.")});