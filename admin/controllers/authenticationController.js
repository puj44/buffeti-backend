const sendError = require("../../common/sendError");
const sendResponse = require("../../common/sendResponse");
const { signJWT, verifyJWT } = require("../../controllers/utils/jwtUtils");
const users = require("../../db/models/users");
const bcrypt = require("bcrypt");


const signin = async (req,res) =>{
    const {email, password} = req.body;
    try{
        console.log("asd");
        const user = await users.findOne({email});
        console.log(user);
        if(!user){
            return sendResponse(res, 401, {
                message:"Invalid Email or Password"
            });
        }
        console.log("asd2");
        let response =  await new Promise((resolve,reject) =>{

            bcrypt.compare(password,user.password,(err,hash_result)=>{
                if(err) reject(false);
                resolve(hash_result)
            })
        })
        console.log(response);
        if(!response) return sendResponse(res,401, {message:"Invalid Email or Password"});

        const accessToken = signJWT(
            {
                "id":user._id,
                "email":user.email,
                "name":user.name
            },
            '72h'
        )
        
        res.cookie(
            "token",
            accessToken,
            {
                maxAge:300000,
                httpOnly:true,
                sameSite:'none', 
                secure:true
            }
        )
        return sendResponse(
            res, 
            200, 
            {
                data: {
                    user:verifyJWT(accessToken).payload ?? {},
                    accessToken:accessToken
                },
                message:"Login successful!"
            }
        );

    }
    catch(err){
        console.log("Admin Login Error: ",err)
        return sendError(res,err);
    }

}

module.exports = {signin}