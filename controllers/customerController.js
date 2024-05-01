const sendRes = require("./sendResponse");
const sendErr = require("./sendError");

const Users = require('../db/models/users');

// Get All Customers Data API
const getCustomers = async (req,res) =>{
    try{
        const users = await Users.query().select();
        sendRes(res,200,
            {
                message:"Customers Fetched Successfully",
                data:users?.length ? users : []
            }
        )
    }catch(err){
        sendErr(res,err)
    }
}
// Insert Customer Data API
const insertCustomer = async (req,res) =>{
    try{
        // const users = await Users.query().insert({name:req.body?.name});
        sendRes(res,200,{message:"Customer inserted Successfully"})
    }catch(err){
        sendErr(res,err)
    }
}

module.exports = {
    getCustomers,
    insertCustomer
}