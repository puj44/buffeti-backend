
async function isValidPackage(selectedPackage,packages){
    let isValidPackage = true;
    const values = {};
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
}