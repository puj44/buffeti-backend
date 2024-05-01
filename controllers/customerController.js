const sendRes = require("./sendResponse");
const sendErr = require("./sendError");

// Get All Customers Data API
const getCustomers = (req,res) =>{
    try{
        sendRes(res,200,{message:"Customers Fetched Successfully"})
    }catch(err){
        sendErr(res,err)
    }
}

module.exports = {
    getCustomers
}