
async function isValidPackage(selectedPackage,packages){
    let isValidPackage = true;
    const values = {}; //This will have the 
    const categoriesMapings = packages.categoriesMapings;
    categoriesMapings.map((d)=>{
        if(!selectedPackage[d]){
            isValidPackage = false;
        }else{
            values = selectedPackage[d];
            if(selectedPackage[d] !== Object.keys(values).length){
                isValidPackage = false;
            }
        }
    });
    return values;

    // if(isValidPackage === false){
    //     //get item from selectedPackage
    //     const itemData = selectedPackage[]

    //     //get 
    // }
}

module.exports = {isValidPackage}