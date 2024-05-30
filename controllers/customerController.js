const sendRes = require("./sendResponse");
const sendErr = require("./sendError");
const mongoose = require('mongoose');
const customers = require('../db/models/customers');
const jwt = require('jsonwebtoken');
const key = process.env.JWT_KEY;

// Get All Customers Data API
// const getCustomers = async (req,res) =>{
//     try{
//         const users = await Users.query().select();
//         sendRes(res,200,
//             {
//                 message:"Customers Fetched Successfully",
//                 data:users?.length ? users : []
//             }
//         )
//     }catch(err){
//         sendErr(res,err)
//     }
// }

// Insert Customer Data API
const insertCustomer = async (req,res) =>{
    const name = req.body.name;
    const mobile_number = req.body.mobile_number;
    const email = req.body.email;
    let token;
    const tobeinserted = undefined;
    try{
        //await mongoose.connect(process.env.MONGO_URL);
        mongoose.connect(process.env.MONGO_URL);
        
        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected');
        });
        mongoose.connection.on('error', (err) => {
            console.error('Mongoose connection error: ' + err);
        });
        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose disconnected');
        });
        //console.log(mongoose.connect(process.env.MONGO_URL));
        tobeinserted = customers.create({
            name:name,
            mobile_number:mobile_number,
            email:email,
        });
        // const firstArticle = await customers.findOne({});
        // console.log(firstArticle);
        console.log(tobeinserted);
        
        if(tobeinserted){
            token = jwt.sign({_id: tobeinserted, 'name':name, 'mobile_number':mobile_number}, key,{expiresIn: '72h'});

        }
        // const users = await Users.query().insert({name:req.body?.name});
        return sendRes(
            res.cookie(
                "token",
                token,
                {expires: new Date(Date.now() + 72 * 3600000),httpOnly:true,sameSite:'none', secure:true}
            ), 
            200, 
            {message:"Customer successfully signed up!"}
        );
    }catch(err){
        sendErr(res,err)
    }
}

module.exports = {
    insertCustomer
}