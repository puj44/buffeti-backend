
async function validatePackage(items,packages){

    let isValidPackage = true;
    let values;
    let categoriesMapings = packages.categories_mapping;

    Object.keys(categoriesMapings).forEach((c)=>{
        if(!items[c]){
            isValidPackage = false;
        }else{
            values = items[c];
            if(categoriesMapings[c] !== Object.keys(values).length){
                isValidPackage = false;
            }
        }
    });

    return isValidPackage;

}
async function calculateItems(itemsData,items,menuOption,noOfPeople,isValidPackage){
    
    let additional_qty,extra_items,preparation,total_price;
    let globalObj = {
        "items":[]
    };
    
    console.log(isValidPackage);
    if(isValidPackage === true){
        Object.keys(items).forEach((category)=>{
            Object.keys(items[category]).forEach((item)=>{
                additional_qty = items[category][item]?.additional_qty;
                extra_items = items[category][item]?.added_extra_items; // need to figure out how to access
                preparation = items[category][item]?.selected_preparation;

                itemsData.forEach((i)=>{
                    if(additional_qty !== null){
                        total_price = total_price + (i.consumer_rate_per_additonal_serving  * additional_qty);
                    }
                    if(extra_items !== null){
                        // total_price = total_price + (i.consumer_rate_per_serving  * extra_items.);
                    }
                });
                

                const itemObj={
                    "item_name":Object.keys(items[category]),
                    "addon_charges": null,
                    "total_price": null
                };

            });
        });
    }else{
        //calculate as per additional price...
    }


}

module.exports = {
    validatePackage, 
    calculateItems
}