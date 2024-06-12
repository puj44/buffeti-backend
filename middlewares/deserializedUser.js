const { verifyJWT } = require("../controllers/utils/jwtUtils");

function deserializedUser(req,res, next){
    const {authorization} = req.headers;
    try{

        if(!authorization){
            return next()
        }

        const {payload,expired} = verifyJWT(authorization.split("Bearer ")[1]);
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