
const xlsx = require("xlsx");
const c2cItems = require("../common/upload-file-process/c2cItems");
const snackBoxItems = require("../common/upload-file-process/snackBoxItems");



 const uploadFile = async(req,res) =>{
    try{
        const {location} = req.body;
        const buffer = req.file.buffer;
        let c2c = {};
        let snackBox = {};
        const workbook = xlsx.read(buffer, {type:"buffer"});
        const packageMenu = workbook.Sheets[workbook.SheetNames[0]];
        const snackBoxMenu = workbook.Sheets[workbook.SheetNames[2]];
        const result = Promise.all([
            await c2cItems(packageMenu),
            await snackBoxItems(snackBoxMenu)
        ]).then((results) => {
            if(results?.length > 0){
                results.map((menus)=>{
                    switch (menus.menu) {
                        case "c2c":
                            c2c = menus.message;
                            break;
                        case "snackBox":
                            snackBox = menus.message;
                            break;
                    }
                })
                console.log("c2c",c2c);
                console.log("sncakbox",snackBox);
            }else{
                console.log("error encounterd!");

            }
        });
        
        //TODO: iterate result and check for type and message, and send array of msgs to frontend sendRes
    }catch(err){
        console.log("err",err)
    }
}

module.exports = {uploadFile}