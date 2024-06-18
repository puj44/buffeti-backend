const keys = require("../config/keys");
const {get} = require("../common/redisGetterSetter");

async function isValidPackage(noOfPeople,selectedPackage,packages,menuOption,location){
    let isValidPackage = true;
    const values = {}; //This will have the items from selectedPackage
    const cachedData = {};
    let items =  await get(`${location}_${menuOption}_${keys.items}`,true);
    //const categoriesMapings = packages["categories_mapping"];
    console.log("selected",selectedPackage);
    console.log("packages",packages);
    //console.log("items",items);
    //console.log("mapings",packages);
    // selectedPackage.foreach((s)=>{
    //     console.log(s);
    // });

    // categoriesMapings.map((d)=>{
    //     if(!selectedPackage[d]){
    //         isValidPackage = false;
    //     }else{
    //         values = selectedPackage[d];//
    //         if(selectedPackage[d] !== Object.keys(values).length){
    //             isValidPackage = false;
    //         }
    //     }
    // });

    //console.log("values",values);

    // if(isValidPackage === false){
    //     values.map((v)=>{
    //         items[Object.keys(v)]
            
    //     });
    // }
}

module.exports = {isValidPackage}