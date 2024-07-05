const Items = require("../db/models/items");
const MiniMeals = require("../db/models/miniMeals");

async function findItems(items, menuOption) {
  try {
    const promises = {};

    if (menuOption === "mini-meals") {
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
      for (const i in items) {
        const data = await Items.findOne({ slug: i }).lean();
        let val = data;
        delete val._id;
        promises[i] = {
          ...val,
          ...(items[i] ?? {}),
        };
      }
    }

    return promises;
  } catch (err) {
    return err;
  }
}

module.exports = { findItems };
