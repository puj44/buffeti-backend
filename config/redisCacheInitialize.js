const {get,set,remove} = require("../common/redisGetterSetter");
const mongoose = require('mongoose');
const keys = require("./keys");
const menuOptions = require("../db/models/menuOptions");
const categories = require("../db/models/categories");
const ItemsModel = require("../db/models/items");
const ExtraItems = require("../db/models/extraItems");
const Preparations = require("../db/models/preparations");
const MiniMeals = require("../db/models/miniMeals");
const Packages = require("../db/models/packages");
const DeliveryFees = require("../db/models/deliveryFees");
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
        `ahmedabad__mini-meals_${keys.items}`,
        `bangalore__mini-meals_${keys.items}`,
    ]
    
    cacheKeys.map(async(k)=>{
        await remove(k)
    });
    return true;
}


//set keys

async function initializeCache(){
    try{

    //SET MENU OPTIONS
    const menuData = await menuOptions.find({}).then((d) => d).catch((err) => ({ errorResponse: err }));
    let menuObj = {};
    if(!menuData?.errorResponse && menuData?.length){
        menuData.map((md,idx)=>{
           menuObj[md.slug.toString()] = md.name;
        })
            await set(keys.menuOptions,menuObj,true);
      
    }else{
        console.log("Err Menu Option: ",JSON.stringify(menuData))
        return;
    }
    //SET CATEGORIES AND SUB CATEGORIES
    const categoriesData = await categories.find({}).then((d) => d).catch((err) => ({ errorResponse: err }));
    if(!categoriesData?.errorResponse && categoriesData?.length){
         await categoriesData.forEach(async(c,idx)=>{
            const obj = c.toObject({flattenMaps:true});
            await set(`${obj.location}_${obj.menu_option}_${keys.categories}`, obj.categories,true);
        })
    }else{
        console.log("Err Categories: ",JSON.stringify(categoriesData?.errorResponse))
        return;
    }
    //SET ITEMS
    const itemsData = await ItemsModel.find({}).then((d) => d).catch((err) => ({ errorResponse: err }));
    let locationBasedObj = {};
    if(!itemsData?.errorResponse && itemsData?.length){
         await itemsData.map((data,idx)=>{
            let item = data.toObject({flattenMaps:true});
            delete item.createdAt;
            delete item.updatedAt;
            delete item.__v;
            locationBasedObj[item.location] = {
                [item.menu_option]:{
                    ...locationBasedObj[item.location]?.[item.menu_option],
                    [item.category.slug]:{
                        ...locationBasedObj[item.location]?.[item.category.slug] ?? {},
                        [item.sub_category?.slug ?? item.category.slug]:{
                            ...locationBasedObj[item.location]?.[item.category.slug]?.[item.sub_category?.slug ?? item.category.slug] ?? {},
                            [item.slug]:item
                        }
                    }
                }
            }
          
        });
        locationBasedObj && Object.keys(locationBasedObj).length > 0 &&
        Object.keys(locationBasedObj).map(async(loc)=>{
            Object.keys(locationBasedObj[loc]).map(async(menu)=>{
                await set(`${loc}_${menu}_${keys.items}`, locationBasedObj[loc][menu],true);
            })
        })
    }else{
        console.log("Err Items: ",JSON.stringify(itemsData))
        return true;
    }
      //SET EXTRA ITEMS
      const extraItemsData = await ExtraItems.find({}).then((d) => d).catch((err) => ({ errorResponse: err }));
      locationBasedObj = {};
      if(!extraItemsData?.errorResponse && extraItemsData?.length){
           await extraItemsData.map((data,idx)=>{
              let item = data.toObject({flattenMaps:true});
              delete item.createdAt;
              delete item.updatedAt;
              delete item.__v;
              locationBasedObj[item.location] = {
                  ...locationBasedObj[item.location],
                  [item.slug]:item
              }
            
          });
          locationBasedObj && Object.keys(locationBasedObj).length > 0 &&
          Object.keys(locationBasedObj).map(async(loc)=>{
              await set(`${loc}_click2cater_${keys.extra_items}`, locationBasedObj[loc],true);
          })
      }else{
          console.log("Err Extra Items: ",JSON.stringify(extraItemsData))
          return true;
      }

       //SET PREPARATIONS
       const preparationsData = await Preparations.find({}).then((d) => d).catch((err) => ({ errorResponse: err }));
       locationBasedObj = {};
       if(!preparationsData?.errorResponse && preparationsData?.length){
            await preparationsData.map((data,idx)=>{
               let item = data.toObject({flattenMaps:true});
               delete item.createdAt;
               delete item.updatedAt;
               delete item.__v;
               locationBasedObj[item.location] = {
                   ...locationBasedObj[item.location],
                   [item.slug]:item
               }
             
           });
           if(locationBasedObj && Object.keys(locationBasedObj).length > 0)
           for (const loc of Object.keys(locationBasedObj)) {
            await set(`${loc}_click2cater_${keys.preparations}`, locationBasedObj[loc], true);
            }
       }else{
           console.log("Err Preparations Items: ",JSON.stringify(preparationsData))
           return true;
       }

       //SET TYPE OF PACKAGES (Click2Cater)
       const packagesData = await Packages.find({}).then((d) => d).catch((err) => ({ errorResponse: err}));
       if(!packagesData?.errorResponse && packagesData?.length){
        let globalObj = {};
        for (const obj of packagesData){
            globalObj[obj.location] = {
                ...globalObj[obj.location],
                [obj.menu_option]:{
                    ...globalObj[obj.location]?.[obj.menu_option],
                    [obj.category?.slug]:{
                        ...globalObj[obj.location]?.[obj.menu_option]?.[obj.category?.slug],
                        [obj.slug]:obj
                    }
                }
                
            }
        }
        for(const loc of Object.keys(globalObj)){
            for(const menu of Object.keys(globalObj[loc])){
                await set(`${loc}_${menu}_${keys.packages}`,globalObj[loc][menu],true);
            }
        }
       }else{
            console.log("Err Type of Packages: ",JSON.stringify(packagesData));
            return true;
       }

       //SET MINI-MEALS
       const miniMealsData = await MiniMeals.find({}).then((d) => d).catch((err) => ({ errorResponse: err}));
       if(!miniMealsData?.errorResponse && miniMealsData?.length){
        let globalObj = {};
        for (const obj of miniMealsData){
            globalObj[obj.location] = {
                ...globalObj[obj.location],
                [obj.slug]:obj
            }
        }
        for(const loc of Object.keys(globalObj)){
            await set(`${loc}_mini-meals_${keys.items}`,globalObj[loc],true);
        }
       }else{
            console.log("Err Mini Meals Items: ",JSON.stringify(miniMealsData));
            return true;
       }

       //SET DELIVERY FEES
       const deliveryFeesData = await DeliveryFees.find({}).then((d) => d).catch((err) => ({ errorResponse: err}));
       if(!deliveryFeesData?.errorResponse && deliveryFeesData?.length){
        let globalObj = {};
        for (const obj of deliveryFeesData){
            if(!globalObj[obj.location]){
                globalObj[obj.location] = [];
            }
            globalObj[obj.location].push({
                min:obj.min,
                max:obj?.max ?? undefined,
                fees:obj.fees
            })
        }
        for(const loc of Object.keys(globalObj)){
            await set(`${loc}_${keys.delivery_fees}`,globalObj[loc],true);
        }
       }else{
            console.log("Err Delivery Fees: ",JSON.stringify(deliveryFeesData));
            return true;
       }

    }catch(err){
        console.log("CACHE ERROR:",err)
    }
    // 
    //RETURN
    return true;
}




async function resetCache(){
    let isFinished = false;
    const response = await forgetCache();
    if(response){
        if(await initializeCache()){
            isFinished = true;
        }
    }
    if(isFinished){
        process.exit(0);
    }
}

resetCache();
