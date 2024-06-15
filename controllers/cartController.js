const {getPackage} = require("../common/calculatePackages"); 
const keys = require("../config/keys");

const addtocart = async (req,res)=>{
    const {location} = req.headers;
    const {menuOption,packageData} = req.body;

    let packages = await get(`${location}_${menuOption}_${keys.packages}`,true);

    if (packageData && packages){
        const packageToBeAdded = await isValidPackage(packageData,JSON.parse(JSON.stringify(packages)));
    }

}

module.exports = {addtocart}