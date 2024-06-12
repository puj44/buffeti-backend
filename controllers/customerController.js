const sendRes = require("../common/sendResponse");
const sendErr = require("../common/sendError");
const customers = require('../db/models/customers');
const jwt = require('jsonwebtoken');
const errorHandling = require("../common/mongoErrorHandling");

const insertCustomer = async (req,res) =>{
    const {name, mobile_number, email} = req.body;

    try{
        const customer = await customers.findOne({mobile_number}).then((d) => d);
        if(customer) return sendRes(res, 402, {message:"Account already exists"})
        const tobeinserted = await customers.create({
            name:name,
            mobile_number:mobile_number,
            email:email,
        }).then((d)=>d).catch((err)=>err);

        if(tobeinserted?.errorResponse){
            const errorMessage = await errorHandling(tobeinserted?.errorResponse);
            return sendRes(
                res,400,{message:errorMessage}
            )
        }

        return sendRes(
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