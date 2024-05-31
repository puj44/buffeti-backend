function getLabel(str){
    let string = str.replace("_"," ");
    string = string.charAt(0).toUpperCase() + string.slice(1);
    return string;
}

async function errorHandling(errorResponse){
    if(errorResponse){
        const label = getLabel(Object.keys(errorResponse.keyPattern)[0]);
        switch(errorResponse.code){
            case 11000:
                return `${label} already exists!`
        }
    }
}

module.exports = errorHandling;