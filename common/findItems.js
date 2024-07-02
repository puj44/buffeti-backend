const Items = require("../db/models/items");
const MiniMeals = require("../db/models/miniMeals");

async function findItems(items, menuOption, packageName) {
  try {
    const promises = [];

    if (menuOption === "mini-meals") {
      promises.push(MiniMeals.findOne({ slug: packageName }).then((d) => d));
    } else {
      items.forEach((values, keys) => {
        values.forEach((value, key) => {
          promises.push(Items.findOne({ slug: key }).then((d) => d));
        });
      });
    }
    const results = await Promise.all(promises);
    return results;
  } catch (err) {
    return err;
  }
}

module.exports = { findItems };
