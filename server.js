const express = require('express');
require('dotenv').config()
const PORT = process.env.PORT || 3001;
const app = express();
const routes = require('./routes')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors=require('cors');
const { ValidationError } = require('express-validation');
const mongoose = require('mongoose');
// const corsOptions = {
//   origin: [
//     "*"S
//   ],

//   credentials: true
// }
mongoose.connect(process.env.MONGO_URL);

app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', ['*']);
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.append('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type');
  res.append('Access-Control-Allow-Credentials', true)
  next();
});

//access config consts
app.use(express.json());
// app.use('/static',express.static(join(process.cwd(),"public")));
app.use(bodyParser.json());
app.use(express.urlencoded({extended:false}));
app.use(cors());

app.use(cookieParser());
routes(app);

app.use(function(err, req, res, next) {
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json(err)
  }

  return res.status(500).json(err)
})

app.use("*", (req,res) => {
  res.status(502).send("Something went wrong!");
})

app.listen(PORT, (err) => { if(err) console.log(err); console.log("Server started on PORT:",PORT)});