const sendErr = require('../../controllers/sendError');
const menuOptions = require('../models/menuOptions');
const mongoose = require('mongoose');
require('dotenv').config()

mongoose.connect(process.env.MONGO_URL);
const menuOptionsData =  [
    {
        "name":"Click2Cater",
        "slug":"click2cater"
    },
    {
        "name":"Snack Boxes",
        "slug":"snack-boxes"
    },
    {
        "name":"Mini Thali",
        "slug":"mini-thali"
    },
];


async function SeedDatabase() {
    try{
        await menuOptions.insertMany(menuOptionsData).then((d)=>d).catch((err)=> console.log("Menu Options: ",err))
        process.exit(0);
    }
    catch(err){
        console.log("Seed error:",err);
        process.exit(1)
    }
  
}

SeedDatabase();
