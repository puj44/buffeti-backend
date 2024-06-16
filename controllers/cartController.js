const {isValidPackage} = require("../common/calculatePackages"); 
const keys = require("../config/keys");

const addtocart = async (req,res)=>{
    const {location} = req.headers;
    const {menuOption,noOfPeople,packageData} = req.body;
    let packages;

    if(menuOption === "click2cater"){
        packages = await get(`${location}_${menuOption}_${keys.packages}`,true);
    }else if(menuOption === "snack-boxes"){
        packages = await get(`${location}_${menuOption}_${keys.categories}`,true);
    }else{
        packages = await get(`${location}_${menuOption}_${keys.mini_meals}`,true);
    }

    if (packageData && packages){
        const packageToBeAdded = await isValidPackage(packageData /*user Selected Package */,JSON.parse(JSON.stringify(packages))/*cache Package */);
        console.log("values",packageToBeAdded);
    }

}

module.exports = {addtocart}