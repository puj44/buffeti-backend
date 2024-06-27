const {validatePackage, calculateItems} = require("../common/calculateCart"); 
const Items = require("../db/models/items");
const MiniMeals = require("../db/models/miniMeals");
const Packages = require("../db/models/packages");
const sendError = require("../common/sendError");
const { findItems } = require("../common/findItems");

const addtocart = async (req,res)=>{
    const {location} = req.headers;
    const {menuOption,noOfPeople,items} = req.body;
    const packageName = (menuOption === ("click2cater" || "mini-meals")) ? req.body.packageName : null;
    let packagesData;
    let itemsData;
    let isValidPackage = true;
    let totalPrice;
    let categoriesMapings;
    

    try{

        switch (menuOption) {
            case ("click2cater"):
                if(packageName && items){
                    packagesData = await Packages.findOne({slug:packageName}).then((d)=>d);
                    isValidPackage = await validatePackage(items,packagesData);
                }
                itemsData = await findItems(items,menuOption,packagesData);
                break;
            case ("snack-boxes"):
                itemsData = await findItems(items,menuOption);
                break;
            case ("mini-meals"):
                itemsData = await findItems(items,menuOption,packageName);
                break;
        }

        if(packageName && items){
    
            packagesData = await Packages.findOne({slug:packageName}).then((d)=>d);
            isValidPackage = await validatePackage(items,packagesData);
        }

        

        if(itemsData && !itemsData.error){
            totalPrice = await calculateItems(itemsData,items,menuOption,noOfPeople,isValidPackage);
        }else{
            console.log("error");
        }


    }catch(err){
        sendError(res,err);
    }


}

module.exports = {addtocart}