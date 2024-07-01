const { get } = require("../common/redisGetterSetter");
const sendError = require("../common/sendError");
const sendResponse = require("../common/sendResponse");
const keys = require("../config/keys");
const itemsFilter = require("./filters/itemsFilter");


const getCategories = async(req,res) =>{
    try{
        const {location} = req.headers;
        const {menuOption} = req.params;
        const categoriesData = await get(`${location}_${menuOption}_${keys.categories}`,true);
        return sendResponse(
            res,
            200,
            {
                data:{
                    categories:categoriesData ?? {}
                },
                message:"Categories fetched successfully!"
            }
        )
    }catch(err){
        console.log("GET CATEGORIES ERR:",err)
        sendError(res,err)
    }
}

const getItems = async (req,res) => {
    try{
        const {location} = req.headers;
        const {menuOption,category} = req.params;
        const {search, is_jain} = req.query;

        let categoriesData = await get(`${location}_${menuOption}_${keys.categories}`,true);
        //if category exists
        if(!categoriesData || Object.keys(categoriesData ?? {})?.length <= 0 || !categoriesData[category]){
            return sendResponse(
                res,400,
                {
                    message: "Category is incorrect"
                }
            )
        }
        categoriesData = null;
        
        let data = await get(`${location}_${menuOption}_${keys.items}`,true);
        let items = data[category];
        if((search && search !== "") || is_jain === "true"){
            items = await itemsFilter(items,{is_jain:is_jain === "true" ?true:false,search},menuOption);
        }
        
        return sendResponse(
            res,
            200,
            {
                data:{
                    items
                },
                message:"Items fetched successfully!"
            }
        )


    }catch(err){
        console.log("Get Items Error: ",err);
        sendError(res,err);
    }
}

module.exports = {getItems,getCategories}