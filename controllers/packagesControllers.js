const { get } = require("../common/redisGetterSetter");
const sendError = require("../common/sendError");
const sendResponse = require("../common/sendResponse");
const packageFilter = require("./filters/packageFilter");
   
const getPackage = async(req,res) =>{
    try{
        const {location} = req.headers;
        const {menuOption, packageSlug} = req.params; 

        const packages = await get(`${location}_${menuOption}_packages`,true);
        let values = Object.values(packages);
        values.map((v,idx)=>{
            if(v?.[packageSlug]){
                const value = v[packageSlug]
                return sendResponse(
                    res,
                    200,
                    {
                        data:{
                            package:{
                                slug:packageSlug,
                                package_name:value.package_name,
                                items_mapping:value.items_mapping,
                                category:value.category,
                            }
                        },
                        message:"Package fetched successfully!"
                    }
                )
            }
        })
        return sendResponse(
            res,
            400,
            {
                message:"Package not found!"
            }
        )
    }catch(err){
        console.log("Get Package Error:",err);
        sendError(res,err)
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

        return sendResponse(
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
        sendError(res,err)
    }

}

const getFilters = async(req,res) =>{
    try{
        const {location} = req.headers;
        const {menuOption} = req.params;

        const filters = await get(`${location}_${menuOption}_filters`,true);

        return sendResponse(
            res,
            200,
            {
                data:{
                    filters,
                },
                message:"Filters fetched successfully!"
            }
        )
      }catch(err){
        console.log("Get Filters Error:",err);
        sendError(res,err)
    }
}

module.exports = {getFilters,getPackages,getPackage}