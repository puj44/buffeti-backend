const { verifyJWT } = require("../controllers/utils/jwtUtils");

function deserializedUser(req,res, next){
    const {accessToken} = req.cookies;
    try{

        if(!accessToken){
            return next()
        }

        const {payload,expired} = verifyJWT(accessToken);
        if(payload){
            req.user = payload;
            return next()
        }

        return next()
    }catch(err){
        console.log("USER DESERIALIZE ERROR: ",err);
        next()
    }
}

module.exports = deserializedUser;