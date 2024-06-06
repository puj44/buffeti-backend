
const xlsx = require("xlsx");
const c2cItems = require("../common/upload-file-process/c2cItems");
const snackBoxItems = require("../common/upload-file-process/snackBoxItems");
const sendErr = require("../../common/sendError");
const sendRes = require("../../common/sendResponse");
const { convertToSlug } = require("../common/convertToSlug");
const items = require("../db/models/items");
const categories = require("../db/models/categories");



 const uploadFile = async(req,res) =>{
    try{
        const location = req.body.location;
        const buffer = req.file.buffer;
        // const sheetIndexes = {
        //     "c2c-menu":0,
        //     "c2c-packages":1,
        //     "snack-box-menu":2,
        //     "mini-meals-and-thali":3,
        //     "delivery-fees":4,
        // }
        let c2c = {};
        let snackBox = {};
        let toBeInserted = {
            [location]:{

            }
        };
        const workbook = xlsx.read(buffer, {type:"buffer"});
        // const sheetNames = workbook.SheetNames;
        // console.log(sheetNames);
        const packageMenu = workbook.Sheets[workbook.SheetNames[0]];
        const snackBoxMenu = workbook.Sheets[workbook.SheetNames[2]];
        const result =await Promise.all([
            await c2cItems(packageMenu),
            await snackBoxItems(snackBoxMenu)
        ]).then((results) => {
            if(results?.length > 0){
                results.map((menus)=>{
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
                })
                // toBeInserted[location] ={
                //     "click2cater":c2c,
                //     "snackBox":snackBox
                // };
                // console.log("final",toBeInserted);
            }else{
                
                console.log("error encounterd!");

            }
            return true;
        });
      if(result){
        const categoryObj = {
            location:location,
            menu_option:"click2cater",
            categories:c2c.categories,
        }
        const categoriesResult = await categories.create(categoryObj).then((d)=>d).catch((err)=>err);
        console.log("OBJECT:",categoryObj?.categories?.beverages?.sub_categories);
        if(categoryObj?.errorResponse){
            const errorMessage = await errorHandling(categoryObj?.errorResponse);
            return sendRes(
                res,400,{message:errorMessage}
            )
        }
        //TODO: initialize cache key object 
        // const users = await Users.query().insert({name:req.body?.name});
        return sendRes(
            // res.cookie(
            //     "token",
            //     token,
            //     {expires: new Date(Date.now() + 72 * 3600000),httpOnly:true,sameSite:'none', secure:true}
            // ), 
            res,
            200, 
            {message:"files successfully uploaded!"}
        );
      }
        
        //TODO: iterate result and check for type and message, and send array of msgs to frontend sendRes
    }catch(err){
        sendErr(res,err);
        console.log("err",err)
    }
}

module.exports = {uploadFile}

// const example = new ExampleModel({
//     location: "SomeLocation",
//     menu_option: "SomeMenuOption",
//     categories: {
//       starters: {
//         name: "Starter",
//         sub_categories: {
//           milkshakes_coffee: "Milkshakes & Coffee",
//         },
//       },
//       main_course: {
//         name: "Main Course",
//         sub_categories: {
//           pasta: "Pasta",
//           pizza: "Pizza",
//         },
//       },
//     },
//   });
  
//   example.save().then(() => {
//     console.log('Example saved successfully!');
//     mongoose.connection.close();
//   }).catch(err => {
//     console.error('Error saving example:', err);
//     mongoose.connection.close();
//   });