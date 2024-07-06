const keys = require("../config/keys");
const Items = require("../db/models/items");
const MiniMeals = require("../db/models/miniMeals");
const { get } = require("./redisGetterSetter");

async function findItems(items, menuOption, location) {
  try {
    const promises = {};
    if (menuOption === "mini-meals") {
      // const data = await get(`${location}_${menuOption}_${keys.packages}`);
      for (const i of items) {
        const data = await MiniMeals.findOne({ slug: i.package_name }).lean();
        let val = JSON.parse(JSON.stringify(data));
        val.cart_item_id = i._id;
        delete val._id;
        promises[i.package_name] = {
          ...val,
          ...(i ?? {}),
        };
      }
    } else {
      let cacheData = await get(`${location}_${menuOption}_${keys.items}`,true);
      for (const i in items) {
        const data = await Items.findOne({ slug: i }).lean();
        let val = data;
        let selected_preparation = val.selected_preparation;
        if(val.extra_items && Object.keys(val.extra_items).length > 0){
          val.extra_items = cacheData[val.category.slug]?.[val.sub_category.slug]?.[i]?.extra_items ?? cacheData[val.category.slug][i]?.extra_items;
        }
        if(val.preparations && Object.keys(val.preparations).length && !val.selected_preparation){
          selected_preparation = Object.keys(val.preparations)[0];
        }
        delete val._id;
        promises[i] = {
          ...val,
          ...(items[i] ?? {}),
          selected_preparation:selected_preparation
        };
      }
      cacheData = null;
    }
    return promises;
  } catch (err) {
    return err;
  }
}

module.exports = { findItems };
