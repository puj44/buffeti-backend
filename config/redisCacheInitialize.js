const {get,set,remove} = require("../common/redisGetterSetter");
const mongoose = require('mongoose');
const keys = require("./keys");
const menuOptions = require("../db/models/menuOptions");
require('dotenv').config()

mongoose.connect(process.env.MONGO_URL);

//forget keys
async function forgetCache(){
    const cacheKeys = [
        keys.menuOptions,
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
    const menuObj = {};
    if(!menuData?.errorResponse && menuData?.length){
        menuData.map((md,idx)=>{
           menuObj[md.slug.toString()] = md.name;
        })
        await set(keys.menuOptions,menuObj,true);
    }else{
        console.log("Err Menu Option: ",JSON.stringify(menuData?.errorResponse))
        return;
    }
    
    //REST HERE....



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
