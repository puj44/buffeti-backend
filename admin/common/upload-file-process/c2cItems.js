const xlsx = require('xlsx');
const { convertToSlug } = require('../convertToSlug');

// {
//     type:success|error,
//     message:message
// }

const indexes ={
    "item":0,
    "category":1,
    "sub_category":2,
    "serving_per_pax":3,
    "unit":4,
    "rate_per_serving":5,
    "additional_serving":6,
    "additional_serving_unit":7,
    "additional_serving_rate":8,
    "food_cost":9,
    "preparation":10,
    "jain":11,
    "extra_items":12
}

async function c2cItems(sheet,location){
    try{
        const jsonData = xlsx.utils.sheet_to_json(sheet, {header:1});
        let globalObj = {
            "items":[],
            "categories":{

            },
            "extra-items":[],
            "preparations":[]
        };

        if(jsonData?.length <= 0){
            throw Error("Data not found");
        }else{
            jsonData.slice(1).map((row, rowIndex)=>{
                if(row?.length > 0){
                    if((row?.[indexes.item]) && (row?.[indexes.item]?.toString()?.trim() !== "")){
                        const category = row[indexes?.category]?.toString()?.trim();
                        //MAIN ITEM OBJECT
                        let itemObj = {};
                        const itemSlug = convertToSlug(row?.[indexes.item]);
                        const categorySlug =  convertToSlug(category);
                        const jain = row[indexes.jain]?.toString()?.trim();
                        
                        itemObj ={
                            "slug":itemSlug,
                            "item_name":row[indexes.item],

                            "location":location,
                            "menu_option":"click2cater",

                            "serving_per_pax":Number(row[indexes.serving_per_pax]),
                            "unit":row[indexes.unit].toString().trim().toLowerCase(),
                            "category":{"slug":categorySlug,"name":category},
                            "sub_category":row[indexes.sub_category]?.toString()?.trim() ? {"slug":convertToSlug(row[indexes.sub_category]?.toString()?.trim()), "name":row[indexes.sub_category]?.toString()?.trim() }:{},
                            "rate_per_serving":Number(row[indexes.rate_per_serving] ?? 0),
                            "is_additonal_serving":row[indexes.additional_serving] ? true : false,
                            "additional_serving": row[indexes.additional_serving] ? Number(row[indexes.additional_serving]):null,
                            "additional_serving_unit":row[indexes.additional_serving_unit] ? row[indexes.additional_serving_unit].toString().trim().toLowerCase():null,
                            "additional_serving_rate":row[indexes.additional_serving_rate] ? Number(row[indexes.additional_serving_rate]):null,
                            "food_cost":row[indexes.food_cost]?Number(row[indexes.food_cost]):null, 
                            "is_jain": jain !== "" && jain ? true :false,
                            "images":[]
                        };

                       
                        //SAVE CATEGORY
                        if(category?.toLowerCase() !== "extra-item" && category.toLowerCase() !== "preparation"){
                            let sub_cat = {}
                            
                            globalObj["categories"][categorySlug] = {
                                ...globalObj["categories"][categorySlug],
                                name:category
                            }
                            // APPEND SUB CATEGORIES TO CORRESPONDING CATEGORY
                            if((row[indexes.sub_category])){
                                sub_cat["slug"] =  convertToSlug(row[indexes.sub_category]);
                                sub_cat["name"] = row[indexes.sub_category].toString().trim();
                                globalObj['categories'][categorySlug]["sub_categories"] = {
                                    ...globalObj["categories"][categorySlug]["sub_categories"],
                                    [sub_cat.slug]:sub_cat.name
                                }
                            }
                            if(row[indexes.extra_items] && row[indexes.extra_items].toString().trim() !== ""){
                                //COMMA SEPERATE INTO ARRAY
                                let itemsString = row[indexes.extra_items].toString().trim();
                                const strArr = itemsString.split(",");
                                let extraItemsArr = {};
                                strArr.map((eI)=>{
                                    const slug = convertToSlug(eI);
                                    extraItemsArr[slug] = eI.toString().trim();
                                });
                                itemObj["extra_items"] = extraItemsArr;
                            }
                            //ADD JAIN ITEMS PREPARATIONS IF EXISTS
                            let jainItems = {};
                            if(jain !== "" && jain?.toLowerCase() !== "y" && jain?.toLowerCase() !== "j"){
                                jain?.split(",")?.map((eI)=>{
                                    const slug = convertToSlug(eI);
                                    jainItems[slug] = eI.toString().trim();
                                });
                                
                            }
                            
                            if(row[indexes.preparation] && row[indexes.preparation].toString().trim() !== ""){
                                //COMMA SEPERATE INTO ARRAY
                                let itemsString = row[indexes.preparation].toString().trim();
                                const strArr = itemsString.split(",");
                                let extraItemsArr = {};
                                strArr.map((eI)=>{
                                    const slug = convertToSlug(eI);
                                    extraItemsArr[slug] = {
                                        "name":eI.toString().trim(),
                                        "is_jain":jainItems[slug] ? true :false
                                    };
                                });
                                itemObj["preparations"] = extraItemsArr;
                            }
                            globalObj["items"].push(itemObj)
                        }
                        else{

                            delete itemObj.category
                            delete itemObj.sub_category
                            delete itemObj.is_additonal_serving
                            delete itemObj.additional_serving
                            delete itemObj.additional_serving_unit
                            delete itemObj.additional_serving_rate
                            delete itemObj.images
                            delete itemObj.jain_preparations

                            //SAVE EXTRA ITEMS
                            if(category?.toLowerCase() !== "preparation"){
                                globalObj["extra-items"].push(itemObj)
                                
                            }
                            //SAVE PREPARATIONS
                            else if(category?.toLowerCase() === "preparation"){

                                delete itemObj.unit;
                                delete itemObj.rate_per_serving;
                                delete itemObj.serving_per_pax;

                                globalObj["preparations"].push(itemObj)
                            }
                        }
                    }else{
                        throw Error("Package Menu - Problem at row number: "+rowIndex+1)
                    }
                }
            });
        }
        return {
            type:"success",
            menu:"c2c",
            data: {...globalObj}
        };
    }catch(err){
        return {
            type:"error",
            message:err?.message
        }
    }
}

module.exports = c2cItems