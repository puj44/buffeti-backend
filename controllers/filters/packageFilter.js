
async function packageFilter(data, params, menuOption){
    const {min,max,category, noOfPeople} = params;
    let filteredData = data;
    switch(menuOption){
        case "click2cater":
            if(category){
                filteredData = {
                    [category]:filteredData?.[category]
                };
            }
            if(min){
                let filteredPrice = {};
                let values = {};
                Object.entries(filteredData).forEach(([category, items]) => {
                    return Object.keys(items).forEach(item => {
                        values[item] = items[item];
                    });
                });
                
                for(const package in values)
                {
                    const packagePricePerPax = values?.[package]?.[noOfPeople];
                    if(Number(packagePricePerPax) >= Number(min) && (Number(packagePricePerPax) <= Number(max) || !max)) {
                        filteredPrice[values?.[package]?.category?.slug] = {
                            ...filteredPrice[values?.[package]?.category?.slug],
                            [package]:values[package]
                        }
                    }
                }
               
                filteredData = filteredPrice;
            }
            break;
        case "mini-meals":
            break;
        default:
            break;
        
    }
    return filteredData;
}

module.exports = packageFilter;