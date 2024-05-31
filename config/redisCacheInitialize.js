const {get,set,remove} = require("../common/redisGetterSetter");
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URL);
//forget keys
const keys = [
    "menu_options",
]

keys.map((k)=>{
    remove(k)
});


//set keys
