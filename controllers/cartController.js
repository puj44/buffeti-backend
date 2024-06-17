const {isValidPackage} = require("../common/calculatePackages"); 
const keys = require("../config/keys");
const {get} = require("../common/redisGetterSetter");

const addtocart = async (req,res)=>{
    const {location} = req.headers;
    const {menuOption,noOfPeople,packageData} = req.body;
    let packages;
    let items;

    if(menuOption === "click2cater"){
        packages = await get(`${location}_${menuOption}_${keys.packages}`,true);
    }else if(menuOption === "snack-boxes"){
        packages = await get(`${location}_${menuOption}_${keys.categories}`,true);
    }else{
        packages = await get(`${location}_${menuOption}_${keys.mini_meals}`,true);
    }

    if(menuOption !== "mini-meals" && packageData !== null && packages !== null){
        const packageToBeAdded = await isValidPackage(noOfPeople,JSON.parse(JSON.stringify(packageData)) /*user Selected Package */,JSON.parse(JSON.stringify(packages))/*cache Package */, menuOption,location);
        console.log("values",packageToBeAdded);
    }else{

    }

}

module.exports = {addtocart}