
async function packageFilter(data, params, menuOption){
    const {min,max,category, noOfPeople} = params;
    let filteredData = data;
    if(category){
        filteredData = {
            [category]:filteredData?.[category]
        };
    }
    if(min){
        let filteredPrice = {};
        let values = {}
        Object.entries(filteredData).forEach(([category, items]) => {
            return Object.keys(items).forEach(item => {
                values[item] = items[item];
            });
        });
        for(const package in values)
            {
                const packagePricePerPax = menuOption === "click2cater" ? values?.[package]?.[noOfPeople] : values?.[package]?.price;
            if(Number(packagePricePerPax) >= Number(min) && (Number(packagePricePerPax) <= Number(max) || !max)) {
                filteredPrice[values?.[package]?.category?.slug] = {
                    ...filteredPrice[values?.[package]?.category?.slug],
                    [package]:values[package]
                }
            }
        }
       
        filteredData = filteredPrice;
    }
    return filteredData;
}

module.exports = packageFilter;