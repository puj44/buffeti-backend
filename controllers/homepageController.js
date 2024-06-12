const sendRes = require("../common/sendResponse");
const sendErr = require("../common/sendError");
const { get } = require("../common/redisGetterSetter");

const getMenuOptions = async(req,res) =>{
    try{

        const menuOptions = await get(`menu_options`,true);
        console.log(await get("ahmedabad_click2cater_packages",true));
        return sendRes(
            res,
            200,
            {
                data:{
                    menuOptions:menuOptions,
                },
                message:"Menu Options Successfully fetched!"
            }
        )

    }catch(err){
        sendErr(res,err)
    }
}


module.exports = {getMenuOptions}