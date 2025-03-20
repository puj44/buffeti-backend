const xlsx = require("xlsx");
const c2cItems = require("../common/upload-file-process/c2cItems");
const snackBoxItems = require("../common/upload-file-process/snackBoxItems");
const sendErr = require("../../common/sendError");
const sendRes = require("../../common/sendResponse");
const { convertToSlug } = require("../common/convertToSlug");
const Categories = require("../../db/models/categories");
const { default: mongoose } = require("mongoose");

const Items = require("../../db/models/items");
const ExtraItems = require("../../db/models/extraItems");
const Preparations = require("../../db/models/preparations");
const {
  typeOfPackages,
} = require("../common/upload-file-process/packagesItems");
const Packages = require("../../db/models/packages");
const MiniMeals = require("../../db/models/miniMeals");
const miniMeals = require("../common/upload-file-process/miniMeals");
const path = require("path");
const fs = require("fs");
const slackLog = require("../../controllers/utils/slackLog");

const uploadFile = async (req, res) => {
  const conn = mongoose.connection;
  const session = await conn.startSession();
  session.startTransaction();
  try {
    let location = req.body.location || req.headers?.location;
    if (!location)
      return sendRes(res, 402, { message: "Location is required" });
    location = location?.toString()?.trim()?.replace("\n","")
    const buffer = req.file.buffer;
    let c2c = {};
    let snackBox = {};
    let typeOfPackage = [];
    let miniMealsPackages = [];
    let errors = [];
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const packageMenu = workbook.Sheets[workbook.SheetNames[0]];
    const packagesData = workbook.Sheets[workbook.SheetNames[1]];
    const snackBoxMenu = workbook.Sheets[workbook.SheetNames[2]];
    const miniMealsMenu = workbook.Sheets[workbook.SheetNames[3]];

    // console.log(miniMealsMenu.A1, miniMealsMenu.A5);

    const result = await Promise.all([
      await c2cItems(packageMenu, location),
      await typeOfPackages(packagesData, location),
      await snackBoxItems(snackBoxMenu, location),
      await miniMeals(miniMealsMenu, location),
    ]).then((results) => {
      if (results?.length > 0) {
        results.map((menus) => {
          if (menus.type === "error") {
            errors.push(menus.message);
          } else {
            switch (menus.menu) {
              case "c2c":
                c2c = { ...menus.data };
                break;
              case "typeOfPackage":
                typeOfPackage = [...menus.data];
                break;
              case "snackBox":
                snackBox = { ...menus.data };
                break;
              case "miniMeals":
                miniMealsPackages = [...menus.data];
                break;
              default:
                break;
            }
          }
        });
      } else {
        console.log("error encounterd!");
      }
      return true;
    });
    if (result) {
      if (errors?.length > 0) {
        return sendRes(res, 400, {
          data: { errors: errors },
        });
      } else {
        //ADD CATEGORIES
        await Categories.deleteMany(
          {  menu_option: "click2cater" },
          { session }
        );
        await Categories.create(
          [
            {
              
              menu_option: "click2cater",
              categories: c2c.categories,
            },
          ],
          { session }
        );

        //ADD ITEMS, EXTRA ITEMS AND PREPARATIONS
        await Items.deleteMany(
          {  menu_option: "click2cater" },
          { session }
        );
        await Items.insertMany([...c2c.items], { session });

        await ExtraItems.deleteMany(
          {  menu_option: "click2cater" },
          { session }
        );
        await ExtraItems.insertMany([...c2c["extra-items"]], { session });

        await Preparations.deleteMany(
          {  menu_option: "click2cater" },
          { session }
        );
        await Preparations.insertMany([...c2c.preparations], { session });
        c2c = {};

        //ADD TYPE OF PACKAGES
        await Packages.deleteMany(
          {  menu_option: "click2cater" },
          { session }
        );
        await Packages.insertMany([...typeOfPackage], { session });

        //ADD SNACK BOX CATEGORIES AND ITEMS
        await Categories.deleteMany(
          {  menu_option: "snack-boxes" },
          { session }
        );
        await Categories.create(
          [
            {
              
              menu_option: "snack-boxes",
              categories: snackBox.categories,
            },
          ],
          { session }
        );
        await Items.deleteMany(
          {  menu_option: "snack-boxes" },
          { session }
        );
        await Items.insertMany([...snackBox.items], { session });

        //ADD MINI MEALS PACKAGES
        await MiniMeals.deleteMany({ location: location }, { session });
        await MiniMeals.insertMany([...miniMealsPackages], { session });

        //COMMIT
        await session.commitTransaction();
        await slackLog("Uploaded", location)
        return sendRes(res, 200, { message: "File uploaded successfully!" });
      }
    }
  } catch (err) {
    await slackLog("CSV Upload Error", err)
    console.log("err", err);
    //ROLLBACK
    await session.abortTransaction();
    return sendErr(res, err);
  }
  session.endSession();
};

const uploadImages = async (req, res) => {
  let unMatchedItems = [];
  const location = req.headers?.location;
  const { menu_option, type } = req.body;
  const typeField = ["package", "item"];
  const files = req.files;
  // console.log(files[0].buffer);

  try {
    if (!location)
      return sendRes(res, 402, { message: "Location is required" });

    if (!files || files.length === 0)
      return sendRes(res, 400, { message: "No files uploaded" });

    if (!typeField.includes(type)) {
      return sendRes(res, 400, {
        message: "type should be either package or item",
      });
    }

    for (const file of files) {
      const originalName = file.originalname;
      const baseName =
        originalName.substring(0, originalName.lastIndexOf(".")) ||
        originalName;
      const fileName = convertToSlug(baseName);
      // console.log(originalName, "", lastDotIndex, "", baseName, "", fileName);

      const imagePath = `/images/${menu_option}/${type}/${fileName}.webp`;
      const uploadPath = path.join(
        __dirname,
        `../../public/images/${menu_option}/${type}`,
        `${fileName}.webp`
      );
      let dbItem = null;

      if (type === "package") {
        if (menu_option === "mini-meals") {
          dbItem = await MiniMeals.findOne({ slug: fileName }).lean();
          if (dbItem) {
            await MiniMeals.updateOne(
              { _id: dbItem._id },
              {
                img_url: imagePath,
              }
            );
          }
        } else if (menu_option === "click2cater") {
          dbItem = await Packages.findOne({ slug: fileName }).lean();
          if (dbItem) {
            await Packages.updateOne(
              { _id: dbItem._id },
              {
                img_url: imagePath,
              }
            );
          }
        } else {
          return sendRes(res, 400, {
            message: "type should be item for menu option Snackbox",
          });
        }
      } else if (type === "item") {
        if (menu_option === "click2cater" || menu_option === "snack-boxes") {
          dbItem = await Items.findOne({ slug: fileName }).lean();

          if (dbItem) {
            await Items.updateOne(
              { _id: dbItem._id },
              {
                img_url: imagePath,
              }
            );
          }
        } else {
          return sendRes(res, 400, {
            message: "type should be package for menu option minimeals",
          });
        }
      }
      if (!dbItem) {
        unMatchedItems.push(fileName);
        if (fs.existsSync(uploadPath)) {
          fs.unlinkSync(uploadPath);
        }
      }
    }
    await slackLog("Upload Images Error: ", menu_option, unMatchedItems);
    return sendRes(res, 200, {
      message: "Images uploaded successfully!",
      data: {
        menu_option: menu_option,
        bad_images: unMatchedItems,
      },
    });
  } catch (err) {
    await slackLog("Upload Images Error: ", err);
    console.log("Upload Image Error: ", err);
    return sendErr(res, err);
  }
};

module.exports = { uploadFile, uploadImages };
