function convertToSlug(str){
    let string = str?.toString()?.trim()?.toLowerCase();
    const symbols = [
        ")",
        "+",
        "/",
        ".",
        "%",
        ",",
        "^",
        "*",
        "@",
        "!",
        "[",
        "]"
    ]
    // REMOVE SYMBOLS
    symbols.map((d)=>{
        string = string.replaceAll(d,"");
    })
    
    string = string.replaceAll("  "," ");
    string = string.replaceAll(" ","-");
    string = string.replaceAll("&","and");
    string = string.replaceAll("(","-");

    return string;
    
}

module.exports = {convertToSlug}