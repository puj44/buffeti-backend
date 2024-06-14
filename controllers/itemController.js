const { get } = require("../common/redisGetterSetter");
const sendError = require("../common/sendError")


const getItems = async (req,res) => {
    try{
        const {location} = req.headers;
        const {menuOption,category} = req.params;
        const {search} = req.query;

        const categoriesData = await get(`${location}_${menuOption}_${category}`,true);
        
        //if category exists
        if(!categoriesData && categoriesData === null){
            return sendRes(
                res,400,
                {
                    message: "category does not exists..."
                }
            )
        }
        
        const items = await get(`${location}_${menuOption}_items`,true);
        console.log("items: ",items);
        // items.map((i)=>{
        //     if(i.category== category)
        // })


    }catch(err){
        sendError(res,err);
    }
}