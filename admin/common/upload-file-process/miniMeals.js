const xlsx = require('xlsx');
const { convertToSlug } = require('../convertToSlug');

// {
//     type:success|error,
//     message:message
// }

const indexes ={
    "item":0,
    "category":1,
    "jain":2,
    "price":3,
    "description":4,
}

async function miniMeals(sheet,location){
    try{
        const jsonData = xlsx.utils.sheet_to_json(sheet, {header:1});
        let globalObj = [];

        if(jsonData?.length <= 0){
            throw Error("Data not found");
        }else{
            jsonData.slice(1).map((row, rowIndex)=>{
                if(row?.length > 0){
                    if((row?.[indexes.item]) && (row?.[indexes.item]?.toString()?.trim() !== "")){
                        const category = row[indexes?.category]?.toString()?.trim();
                        const itemSlug = convertToSlug(row?.[indexes.item]);
                        const categorySlug =  convertToSlug(category);
                        const jain = row[indexes.jain]?.toString()?.toLowerCase()?.trim() ?? null;
                        const itemObj ={
                            "location":location,
                            "slug":itemSlug,
                            "item_name":row[indexes.item],
                            "category":{"slug":categorySlug,"name":category},

                            "price":Number(row[indexes.price] ?? 0),
                            "description":row[indexes.description],

                            "is_jain": jain && jain !== "" && jain === "y" ? true : false
                        }

                        globalObj.push(itemObj);
                    }else{
                        throw Error("Problem at row number: "+rowIndex+1)
                    }
                }
            });
        }
        return {
            type:"success",
            menu:"miniMeals",
            data: [...globalObj]
        };
    }catch(err){
        return {
            type:"error",
            message:err?.message
        }
    }
}

module.exports = miniMeals