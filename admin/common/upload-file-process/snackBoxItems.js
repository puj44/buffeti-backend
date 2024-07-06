const xlsx = require('xlsx');
const { convertToSlug } = require('../convertToSlug');

// {
//     type:success|error,
//     message:message
// }

const indexes ={
    "item":0,
    "category":1,
    "serving_per_pax":2,
    "unit":3,
    "buffeti_rate_per_serving":4,
    "rate_per_serving":5,
    "food_cost":6
}

async function snackBoxes(sheet,location){
    try{
        const jsonData = xlsx.utils.sheet_to_json(sheet, {header:1});
        let globalObj = {
            "items":[],
            "categories":{

            }
        };

        if(jsonData?.length <= 0){
            throw Error("Data not found");
        }else{
            jsonData.slice(1).map((row, rowIndex)=>{
                if(row?.length > 0){
                    if((row?.[indexes.item]) && (row?.[indexes.item]?.toString()?.trim() !== "")){
                        const category = row[indexes?.category]?.toString()?.trim();
                        const itemSlug = convertToSlug(row?.[indexes.item]);
                        const categorySlug =  convertToSlug(category);
                        const itemObj ={
                            "location":location,
                            "menu_option":"snack-boxes",

                            "slug":itemSlug,
                            "item_name":row[indexes.item],
                            "serving_per_pax":Number(row[indexes.serving_per_pax] ?? 0),
                            "unit":row[indexes.unit].toString().trim().toLowerCase(),
                            "category":{"slug":categorySlug,"name":category},
                            "rate_per_serving":Number(row[indexes.rate_per_serving] ?? 0),
                            "buffeti_rate_per_serving":Number(row[indexes.buffeti_rate_per_serving] ?? 0),
                        }
                        //SAVE CATEGORY
                        if(category){
                            globalObj["categories"][categorySlug] = {
                                name:category,
                            }
                        }

                        globalObj["items"].push(itemObj);
                    }else{
                        throw Error("snackbox - Problem at row number: "+rowIndex+1)
                    }
                }
            });
        }
        return {
            type:"success",
            menu:"snackBox",
            data: {...globalObj}
        };
    }catch(err){
        return {
            type:"error",
            message:err?.message
        }
    }
}

module.exports = snackBoxes