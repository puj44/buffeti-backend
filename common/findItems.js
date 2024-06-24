const Items = require("../db/models/items");
const MiniMeals = require("../db/models/miniMeals");


async function findItems(items,menuOption,packages,packageName){
    try{
        const promises = [];

        if(menuOption === "click2cater"){
            Object.keys(packages.categories_mapping).forEach((c)=>{
                promises.push(Items.findOne({slug:Object.keys(items[c])}).then((d)=>d));
            });
        }else if(menuOption === "snack-boxes"){
            Object.keys(items).forEach((c)=>{
                promises.push(Items.findOne({slug:Object.keys(items[c])}).then((d)=>d));
            });
        }else{
            promises.push(MiniMeals.findOne({slug:packageName}).then((d)=>d));
        }
        const results = await Promise.all(promises);
        return results;
    }catch(err){
        return err;
    }
}

module.exports = {findItems}