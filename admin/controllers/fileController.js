
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
const ExtraItems = require("../../db/models/extraItems");
const Preparations = require("../../db/models/preparations");
const { typeOfPackages } = require("../common/upload-file-process/packagesItems");
const Packages = require("../../db/models/packages");
const MiniMeals = require("../../db/models/miniMeals");
const miniMeals = require("../common/upload-file-process/miniMeals");

 const uploadFile = async(req,res) =>{
     const conn = mongoose.connection;
     const session = await conn.startSession();
     session.startTransaction();
    try{
        const location = req.body.location;
        const buffer = req.file.buffer;
        let c2c = {};
        let snackBox = {};
        let typeOfPackage = [];
        let miniMealsPackages = [];
        let errors = [];
        const workbook = xlsx.read(buffer, {type:"buffer"});
        const packageMenu = workbook.Sheets[workbook.SheetNames[0]];
        const packagesData = workbook.Sheets[workbook.SheetNames[1]];
        const snackBoxMenu = workbook.Sheets[workbook.SheetNames[2]];
        const miniMealsMenu = workbook.Sheets[workbook.SheetNames[3]];

        const result =await Promise.all([
            await c2cItems(packageMenu,location),
            await typeOfPackages(packagesData,location),
            await snackBoxItems(snackBoxMenu,location),
            await miniMeals(miniMealsMenu,location),
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
                            case "typeOfPackage":
                                typeOfPackage = [...menus.data];
                                break;
                            case "snackBox":
                                snackBox = {...menus.data};
                                break;
                            case "miniMeals":
                                miniMealsPackages = [...menus.data];
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
            await Categories.deleteOne({location:location,menu_option:"click2cater"},{session});
            await Categories.create([{
                location:location,
                menu_option:"click2cater",
                categories:c2c.categories,
            }],{session});

            //ADD ITEMS, EXTRA ITEMS AND PREPARATIONS
            await Items.deleteMany({location:location, menu_option:"click2cater"},{session});
            await Items.insertMany([...c2c.items],{session});
       
            await ExtraItems.deleteMany({location:location, menu_option:"click2cater"},{session})
            await ExtraItems.insertMany([...c2c["extra-items"]],{session});
         
            await Preparations.deleteMany({location:location, menu_option:"click2cater"},{session})
            await Preparations.insertMany([...c2c.preparations],{session})
            c2c = {};

            //ADD TYPE OF PACKAGES
            await Packages.deleteMany({location:location, menu_option:"click2cater"},{session})
            await Packages.insertMany([...typeOfPackage],{session})

            //ADD SNACK BOX CATEGORIES AND ITEMS
            await Categories.deleteOne({location:location,menu_option:"snack-boxes"},{session});
            await Categories.create([{
                location:location,
                menu_option:"snack-boxes",
                categories:snackBox.categories,
            }],{session});
            await Items.deleteMany({location:location, menu_option:"snack-boxes"},{session});
            await Items.insertMany([...snackBox.items],{session});

            //ADD MINI MEALS PACKAGES
            await MiniMeals.deleteMany({location:location},{session})
            await MiniMeals.insertMany([...miniMealsPackages],{session});

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
        console.log("err",err)
        //ROLLBACK
        await session.abortTransaction();
        return sendErr(res,err);
    }
    session.endSession();
}

module.exports = {uploadFile}
