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
    "preparation":9,
    "jain":10,
    "extra_items":11
}

async function c2cItems(sheet){
    try{
        const jsonData = xlsx.utils.sheet_to_json(sheet, {header:1});
        let globalObj = {
            "items":{

            },
            "categories":{

            },
            "extra-items":{

            },
            "preparations":{

            }
        };
        // console.log(jsonData);
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
                            "sub_category":row[indexes.sub_category]?.toString()?.trim(),
                            "rate_per_serving":Number(row[indexes.rate_per_serving]),
                            "is_additonal_serving":row[indexes.additional_serving] ? true : false,
                            "additional_serving": row[indexes.additional_serving] ? Number(row[indexes.additional_serving]):null,
                            "additional_serving_unit":row[indexes.additional_serving_unit] ? row[indexes.additional_serving_unit].toString().trim().toLowerCase():null,
                            "additional_serving_rate":row[indexes.additional_serving_rate] ? Number(row[indexes.additional_serving_rate]):null,

                        }
                        //SAVE CATEGORY
                        if(category?.toLowerCase() !== "extra-item" && category.toLowerCase() !== "preparation"){
                            let sub_cat = {}
                            
                            globalObj["categories"][categorySlug] = {
                                name:category,
                            }
                            if((row[indexes.sub_category])){
                                sub_cat["slug"] =  convertToSlug(row[indexes.sub_category]);
                                sub_cat["name"] = row[indexes.sub_category].toString().trim();
                                globalObj["categories"][categorySlug]["sub_category"] = {
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
                            if(row[indexes.preparation] && row[indexes.preparation].toString().trim() !== ""){
                                //COMMA SEPERATE INTO ARRAY
                                let itemsString = row[indexes.preparation].toString().trim();
                                const strArr = itemsString.split(",");
                                let extraItemsArr = {};
                                strArr.map((eI)=>{
                                    const slug = convertToSlug(eI);
                                    extraItemsArr[slug] = eI.toString().trim();
                                });
                                itemObj["preparations"] = extraItemsArr;
                            }
                            globalObj["items"][categorySlug] = {
                                ...globalObj["items"][categorySlug],
                                [itemSlug]:itemObj
                            }
                        }
                        //SAVE EXTRA ITEMS
                        else if(category?.toLowerCase() !== "preparation"){
                            globalObj["extra-items"] = {
                                ...globalObj["extra-items"],
                                [itemSlug]:itemObj
                            }
                            
                        }
                        //SAVE PREPARATIONS
                        else if(category?.toLowerCase() === "preparation"){
                            globalObj["preparations"] = {
                                ...globalObj["preparations"],
                                [itemSlug]:itemObj
                            }
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
            menu:"c2c",
            message: globalObj
        };
    }catch(err){
        return {
            type:"error",
            message:err?.message
        }
    }
}

module.exports = c2cItems