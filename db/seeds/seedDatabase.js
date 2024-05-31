const sendErr = require('../../controllers/sendError');
const menuOptions = require('../models/menuOptions');

const menuOptionsData =  [
    {
        "name":"Click2Cater",
        "slug":"click2cater"
    },
    {
        "name":"Snack Boxes",
        "slug":"snack-boxes"
    },
    {
        "name":"Mini Thali",
        "slug":"mini-thali"
    },
];

async function SeedDatabase() {
    try{
        await menuOptions.create(menuOptionsData).then((d)=>d).catch((err)=>err);
    }
    catch(err){
        console.log("Seed error:",err);

    }
}

SeedDatabase();
