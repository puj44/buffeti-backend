const {get,set,remove} = require("../common/redisGetterSetter");
const mongoose = require('mongoose');
const keys = require("./keys");
const menuOptions = require("../db/models/menuOptions");
const categories = require("../db/models/categories");
const ItemsModel = require("../db/models/items");
require('dotenv').config()

mongoose.connect(process.env.MONGO_URL);

//forget keys
async function forgetCache(){
    const cacheKeys = [
        keys.menuOptions,
        `ahmedabad_click2cater_${keys.categories}`,
        `bangalore_click2cater_${keys.categories}`,
        `ahmedabad_click2cater_${keys.items}`,
        `bangalore_click2cater_${keys.items}`,
        `ahmedabad_click2cater_${keys.extra_items}`,
        `bangalore_click2cater_${keys.extra_items}`,
        `ahmedabad_click2cater_${keys.preparations}`,
        `bangalore_click2cater_${keys.preparations}`,
    ]
    
    cacheKeys.map(async(k)=>{
        await remove(k)
    });
    return true;
}


//set keys

async function initializeCache(){
    //SET MENU OPTIONS
    const menuData = await menuOptions.find({}).then((d) => d).catch((err) => err);
    let menuObj = {};
    if(!menuData?.errorResponse && menuData?.length){
        menuData.map((md,idx)=>{
           menuObj[md.slug.toString()] = md.name;
        })
        await set(keys.menuOptions,menuObj,true);
    }else{
        console.log("Err Menu Option: ",JSON.stringify(menuData?.errorResponse))
        return;
    }
    
    const categoriesData = await categories.find({}).then((d) => d).catch((err) => err);
    if(!categoriesData?.errorResponse && categoriesData?.length){
         await categoriesData.forEach(async(c,idx)=>{
            const obj = c.toObject({flattenMaps:true});
            await set(`${obj.location}_${obj.menu_option}_${keys.categories}`, obj.categories,true);
        })
    }else{
        console.log("Err Categories: ",JSON.stringify(categoriesData?.errorResponse))
        return;
    }
    const itemsData = await ItemsModel.find({}).then((d) => d).catch((err) => err);
    if(!itemsData?.errorResponse && itemsData?.length){
         await itemsData.map(async(data,idx)=>{
            const item = data.toObject({flattenMaps:true});

            await Promise.all([await set(`${item.location}_${item.menu_option}_${keys.items}`, item.menu_items,true),
            await set(`${item.location}_${item.menu_option}_${keys.extra_items}`, item.extra_items,true),
            await set(`${item.location}_${item.menu_option}_${keys.preparations}`, item.preparations,true)]);
            console.log(await get(`${item.location}_${item.menu_option}_${keys.extra_items}`));
        })
    }else{
        console.log("Err Items: ",JSON.stringify(itemsData?.errorResponse))
        return;
    }
    // 
    
    //RETURN
    return true;
}




async function resetCache(){
    const response = await forgetCache();
    if(response){
        await initializeCache();
    }
    process.exit(0);
}

resetCache();
