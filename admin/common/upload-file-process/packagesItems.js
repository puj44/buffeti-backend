const xlsx = require('xlsx');
const { convertToSlug } = require('../convertToSlug');

// {
//     type:success|error,
//     message:message
// }

const c2cIndexes ={
    "category":1,
    "package":2,
    "categories":3,
    "items":4,
    "10_20":5,
    "20_30":6,
    "30_plus":7,
}


async function typeOfPackages(sheet, location){
    try{
        const jsonData = xlsx.utils.sheet_to_json(sheet, {header:1});
        let globalObj = [];
        // console.log(jsonData);
        if(jsonData?.length <= 0){
            throw Error("Data not found");
        }else{
            jsonData.slice(1).map((row, rowIndex)=>{
                if(row?.length > 0){
                    if((row?.[c2cIndexes.package]) && (row?.[c2cIndexes.package]?.toString()?.trim() !== "")){

                        const packageName = row[c2cIndexes?.package]?.toString()?.trim();
                        const packageSlug = convertToSlug(packageName);
                        let categoriesMapping = {};
                        let itemsMapping = [];

                        const briefDescription = row[c2cIndexes.categories]?.toString()?.trim();
                        const itemsDescription = row[c2cIndexes.items]?.toString()?.trim();

                        //MAP CATEGORIES WITH QUANTITY FOR PACKAGE
                        const splitCategories = briefDescription?.split("+");
                        splitCategories.forEach((cat)=>{
                            let splitQty = cat.toString().trim().split(" ");
                            const categorySlug = convertToSlug(splitQty[1]);
                            categoriesMapping[categorySlug] = Number(splitQty[0]?.toString()?.trim());
                        })

                        //MAP ITEMS FOR PACKAGE
                        const splitItems = itemsDescription?.split(",");
                        splitItems.forEach((cat)=>{
                            const itemSlug = convertToSlug(cat);
                            itemsMapping.push(itemSlug);
                        })

                        //MAIN ITEM OBJECT
                        globalObj.push({
                            "slug":packageSlug,
                            "package_name":packageName,
                            "location":location,
                            "menu_option":"click2cater",

                            "categories_description": briefDescription,
                            "categories_mapping": categoriesMapping,
                            "items_mapping": itemsMapping,

                            "category":{
                                "slug":row?.[c2cIndexes.category] ? convertToSlug(row?.[c2cIndexes.category]) : null,
                                "name":row?.[c2cIndexes.category] ?? null,
                            },

                            "_10_20_pax": Number(row[c2cIndexes["10_20"]]?.toString()?.trim()),
                            "_20_30_pax": Number(row[c2cIndexes["20_30"]]?.toString()?.trim()),
                            "_30_plus_pax": Number(row[c2cIndexes["30_plus"]]?.toString()?.trim()),
                        });
                    }else{
                        throw Error("Packages - Problem at row number: "+rowIndex+1)
                    }
                }
            });
        }
        return {
            type:"success",
            menu:"typeOfPackage",
            data: [...globalObj]
        };
    }catch(err){
        return {
            type:"error",
            message:err?.message
        }
    }
}

module.exports = {typeOfPackages}