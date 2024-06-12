const sendError = require("../common/sendError");
const sendResponse = require("../common/sendResponse");
const { verifyJWT } = require("../controllers/utils/jwtUtils");

function authenticateUser(req,res, next){
    const {authorization} = req.headers;
    try{

        if(!authorization){
            return sendResponse(
                res,
                403,
                {
                    message:"No Token Provided"
                }
            )
        }

        const {payload,expired} = verifyJWT(authorization.split("Bearer ")[1]);
        if(!payload){
            return sendResponse(
                res,
                403,
                {
                    message:"Failed to authenticate token."
                }
            )
        }

        next()
    }catch(err){
        console.log("USER MIDDLEWARE ERROR: ",err);
        return sendError(res, err)
    }
}

module.exports = authenticateUser;