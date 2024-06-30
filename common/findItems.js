const Items = require("../db/models/items");
const MiniMeals = require("../db/models/miniMeals");


async function findItems(items,menuOption,packageName){
    try{
        const promises = [];

        if(menuOption === "mini-meals"){
            promises.push(MiniMeals.findOne({slug:packageName}).then((d)=>d));
        }else{
            Object.keys(items).forEach((c)=>{
                Object.keys(items[c]).map((i)=>{
                    promises.push(Items.findOne({slug:i}).then((d)=>d));
                });
            });
        }
        const results = await Promise.all(promises);
        return results;
    }catch(err){
        return err;
    }
}

module.exports = {findItems}