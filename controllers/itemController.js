const { get } = require("../common/redisGetterSetter");
const sendError = require("../common/sendError");
const sendResponse = require("../common/sendResponse");
const keys = require("../config/keys");


const getItems = async (req,res) => {
    try{
        const {location} = req.headers;
        const {menuOption,category} = req.params;
        const {search} = req.query;

        const categoriesData = await get(`${location}_${menuOption}_${keys.categories}`,true);
        //if category exists
        if(!categoriesData || Object.keys(categoriesData ?? {})?.length <= 0 || !categoriesData[category]){
            return sendResponse(
                res,400,
                {
                    message: "Category is incorrect"
                }
            )
        }
        
        let items = await get(`${location}_${menuOption}_${keys.items}`,true);
        if(menuOption === "click2cater"){
            let values = {}
            // Object.entries(filteredData).forEach(([category, items]) => {
            //     return Object.keys(items).forEach(item => {
            //         values[item] = items[item];
            //     });
            // });
        }
        // items.map((i)=>{
        //     if(i.category== category){
        //         //sendRes item obj
        //     }
        // })
        return sendResponse(
            res,
            200,
            {
                message:"Items fetched successfully!"
            }
        )


    }catch(err){
        console.log("Get Items Error: ",err);
        sendError(res,err);
    }
}

module.exports = {getItems}