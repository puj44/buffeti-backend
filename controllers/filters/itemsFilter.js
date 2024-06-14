async function itemsFilter(data, params, menuOption){
    const {is_jain, search} = params;
    let filteredData = JSON.parse(JSON.stringify(data));
    let values = filteredData;

    if(search){
        
        let filteredSearch = {};
        if(menuOption === "click2cater"){
            values = {}
            Object.entries(filteredData).forEach(([category, items]) => {
                Object.keys(items).forEach(item => {
                    values[item] = items[item];
                });
            });
        }
        Object.entries(values).forEach(([key,value])=>{
            const name = value?.item_name?.toString().trim().toLowerCase();
            if(search.toLowerCase() === name || (name).startsWith(search.toLowerCase()) || name.includes(search.toLowerCase())){
                filteredSearch[key] = value;
            }
        });
        values = {...filteredSearch};
    }
    if(is_jain === true){
        let filteredJain = {};
        Object.entries(filteredData).forEach(([category, items]) => {
            switch(menuOption){
                case "click2cater":
                    Object.entries(items).forEach(([slug, item]) => {
                        const preparations = item?.preparations;
                        
                        if(item?.is_jain){
                            

                            if(preparations && Object.keys(preparations).length > 0){
                                let newItem = item;
                                let preparationsObj = {};
                                for(const prep in preparations){
                                    if(preparations[prep]?.is_jain === true){
                                        preparationsObj[prep] = preparations[prep]
                                    }
                                }
                                newItem.preparations = preparationsObj;
                                filteredJain[category] ={
                                    ...filteredJain[category],
                                    [slug]:newItem
                                }
                                
                            }else{
                                
                                filteredJain[category] ={
                                    ...filteredJain[category],
                                    [slug]:item
                                }
                            }
                        }
                    });
                    break;
                case "snack-boxes":
                    Object.keys(items).forEach(([slug, item]) => {
                        if(item?.is_jain){
                            filteredJain[slug] = item;
                        }
                    });
                    break;
                default:
                    break;
            }
        });
        values = {...filteredJain};
    }
    
    return values;
}

module.exports = itemsFilter;