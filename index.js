const express = require('express');
const PORT = process.env.PORT || 3001;
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

app.get('/api', (req, res) => {
    return res.status(200).send('Working');
});

app.listen(PORT, () => {console.log("Server started.")});