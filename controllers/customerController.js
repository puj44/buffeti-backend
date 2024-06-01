const sendRes = require("./sendResponse");
const sendErr = require("./sendError");
const customers = require('../db/models/customers');
const jwt = require('jsonwebtoken');
const errorHandling = require("../common/mongoErrorHandling");
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
    const {name, mobile_number, email} = req.body;

    let token;
    try{
        const tobeinserted = await customers.create({
            name:name,
            mobile_number:mobile_number,
            email:email,
        }).then((d)=>d).catch((err)=>err);
        // const firstArticle = await customers.findOne({});
        // console.log(firstArticle);
        if(tobeinserted?.errorResponse){
            const errorMessage = await errorHandling(tobeinserted?.errorResponse);
            return sendRes(
                res,400,{message:errorMessage}
            )
        }
        //TODO: initialize cache key object 
        // const users = await Users.query().insert({name:req.body?.name});
        return sendRes(
            // res.cookie(
            //     "token",
            //     token,
            //     {expires: new Date(Date.now() + 72 * 3600000),httpOnly:true,sameSite:'none', secure:true}
            // ), 
            res,
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