const sendError = require("../common/sendError");
const sendResponse = require("../common/sendResponse");

function validateLocation(req,res, next){
    try{
        const {location} = req.headers;
        if(!location) return sendRes(res, 402, {message:"Location is required"});
        next();
    }catch(err){
        console.log("LOCATION MIDDLEWARE ERROR: ",err);
        return sendError(res, err)
    }

}
module.exports = validateLocation;