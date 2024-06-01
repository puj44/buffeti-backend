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
    "rate_per_serving":4
}

async function snackBoxes(sheet){
    try{
        const jsonData = xlsx.utils.sheet_to_json(sheet, {header:1});
        let globalObj = {
            "items":{

            },
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
                        //MAIN ITEM OBJECT
                        let itemObj = {

                        };
                        const itemSlug = convertToSlug(row?.[indexes.item]);
                        const categorySlug =  convertToSlug(category);
                        itemObj ={
                            "slug":itemSlug,
                            "item_name":row[indexes.item],
                            "serving_per_pax":Number(row[indexes.serving_per_pax]),
                            "unit":row[indexes.unit].toString().trim().toLowerCase(),
                            "category":category,
                            "rate_per_serving":Number(row[indexes.rate_per_serving])
                        }
                        //SAVE CATEGORY
                        if(category){
                            globalObj["categories"][categorySlug] = {
                                name:category,
                            }
                        }

                        globalObj["items"][categorySlug] = {
                            ...globalObj["items"][categorySlug],
                            [itemSlug]:itemObj
                        }
                    }else{
                        console.log("ROW",row);
                        throw Error("Problem at row number: "+rowIndex+1)
                    }
                }
            });
        }
        return {
            type:"success",
            menu:"snackBox",
            message: globalObj
        };
    }catch(err){
        return {
            type:"error",
            message:err?.message
        }
    }
}

module.exports = snackBoxes