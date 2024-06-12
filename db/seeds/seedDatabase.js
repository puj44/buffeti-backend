const sendErr = require('../../common/sendError');
const DeliveryFees = require('../models/deliveryFees');
const menuOptions = require('../models/menuOptions');
const mongoose = require('mongoose');
const users = require('../models/users');
const bcrypt = require("bcrypt")
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
        "name":"Mini Meals",
        "slug":"mini-meals"
    },
];

const deliveryFeesData = [
    {
        min:0,
        max:5,
        fees:0,
        location:"ahmedabad"
    },
    {
        min:5,
        max:10,
        fees:199,
        location:"ahmedabad"
    },
    {
        min:10,
        max:20,
        fees:299,
        location:"ahmedabad"
    },
    {
        min:20,
        max:30,
        fees:399,
        location:"ahmedabad"
    },
    {
        min:30,
        max:undefined,
        fees:499,
        location:"ahmedabad"
    },
]


async function SeedDatabase() {
    try{
        await menuOptions.deleteMany({});
        await menuOptions.insertMany(menuOptionsData).then((d)=>d).catch((err)=> console.log("Menu Options: ",err));

        await DeliveryFees.deleteMany({});
        await DeliveryFees.insertMany(deliveryFeesData).then((d)=>d).catch((err)=> console.log("Menu Options: ",err));
        
        await users.deleteOne({email:"pujan007mm@gmail.com"});
        await users.create({
            email:"pujan007mm@gmail.com",
            password:"$2b$10$tUi7Hnd9Hbjm1WaV8WWaEOreXP41xMrwMEFFnj1OvR0kAqcYxbSb.",
            name:"Super Admin",
            is_super_admin:true
        }).then((d)=>d).catch((err)=> console.log("Admin Users: ",err));

        process.exit(0);

    }
    catch(err){
        console.log("Seed error:",err);
        process.exit(1)
    }
  
}

SeedDatabase();
