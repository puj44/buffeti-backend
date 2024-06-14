const sendRes = require("../common/sendResponse");
const sendErr = require("../common/sendError");
const { get } = require("../common/redisGetterSetter");
const packageFilter = require("./filters/packageFilter");

const getMenuOptions = async(req,res) =>{
    try{

        const menuOptions = await get(`menu_options`,true);
        
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
        console.log("Get Menu Option Error:",err);
        sendErr(res,err)
    }
}

const getHomeData = async(req,res) =>{
    try{
        const locations = await get("locations",true);

        return sendRes(
            res,
            200,
            {
                data:{
                    locations
                },
                message:"Data fetched successfully!"
            }
        )
    }catch(err){
        console.log("Get Home Data Error:",err);
        sendErr(res,err)
    }
}

const getPackages = async(req,res) =>{
    try{
        const {location} = req.headers;
        const {menuOption} = req.params;
        const {min,max,category} = req.query;
        const noOfPeople = req.query.no_of_people ? `_${req.query.no_of_people}_pax` :"_10_20_pax";

        let packages = await get(`${location}_${menuOption}_packages`,true);
        const filters = await get(`${location}_${menuOption}_filters`,true);
        
        if(min || max || category || noOfPeople){
            packages = await packageFilter(JSON.parse(JSON.stringify(packages)), {min,max,category,noOfPeople},menuOption) 
        }

        return sendRes(
            res,
            200,
            {
                data:{
                    filters,
                    packages
                },
                message:"Packages fetched successfully!"
            }
        )
    }catch(err){
        console.log("Get Packages Error:",err);
        sendErr(res,err)
    }

}
module.exports = {getMenuOptions,getPackages,getHomeData}