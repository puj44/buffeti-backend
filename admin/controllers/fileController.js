
const xlsx = require("xlsx");
const c2cItems = require("../common/upload-file-process/c2cItems");
const snackBoxItems = require("../common/upload-file-process/snackBoxItems");
const sendErr = require("../../common/sendError");
const sendRes = require("../../common/sendResponse");
const { convertToSlug } = require("../common/convertToSlug");
const Categories = require("../../db/models/categories");
const { default: mongoose } = require("mongoose");

const errorHandling = require("../../common/mongoErrorHandling");
const Items = require("../../db/models/items");

 const uploadFile = async(req,res) =>{
     const conn = mongoose.connection;
     const session = await conn.startSession();
     session.startTransaction();
    try{
        const location = req.body.location;
        const buffer = req.file.buffer;
        let c2c = {};
        let snackBox = {};
        let errors = [];
        const workbook = xlsx.read(buffer, {type:"buffer"});
        const packageMenu = workbook.Sheets[workbook.SheetNames[0]];
        const snackBoxMenu = workbook.Sheets[workbook.SheetNames[2]];

        const result =await Promise.all([
            await c2cItems(packageMenu),
            await snackBoxItems(snackBoxMenu)
        ]).then((results) => {
            if(results?.length > 0){
                results.map((menus)=>{
                    if(menus.type === "error"){
                        errors.push(menus.message);
                    }else{
                        switch (menus.menu) {
                            case "c2c":
                                c2c = {...menus.data};
                                break;
                            case "snackBox":
                                snackBox = {...menus.data};
                                break;
                            default:
                                break;
                        }
                    }
                })
            }else{
                
                console.log("error encounterd!");

            }
            return true;
        });
      if(result){
        if(errors?.length > 0){
            return sendRes(
                res,
                400, 
                {
                    data:
                    {errors:errors}
                }
            );
        }else{
            
            //ADD CATEGORIES
            await Categories.deleteOne({location:location},{session});
            await Categories.create([{
                location:location,
                menu_option:"click2cater",
                categories:c2c.categories,
            }],{session});

            //ADD ITEMS, EXTRA ITEMS AND PREPARATIONS
            await Items.deleteOne({location:location},{session});
            await Items.create([{
                location,
                menu_option:"click2cater",
                menu_items:c2c.items,
                extra_items:c2c["extra-items"],
                preparations:c2c.preparations,
            }],{session})



            //COMMIT
            await session.commitTransaction();

            return sendRes(
                res,
                200, 
                {message:"File uploaded successfully!"}
            );
        }
       
      }
        
    }catch(err){
        console.log("err",err?.errors)
        //ROLLBACK
        await session.abortTransaction();
        return sendErr(res,err);
    }
    session.endSession();
}

module.exports = {uploadFile}
