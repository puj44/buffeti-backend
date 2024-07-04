const Items = require("../db/models/items");
const MiniMeals = require("../db/models/miniMeals");

async function findItems(items, menuOption) {
  try {
    const promises = {};

    if (menuOption === "mini-meals") {
      await items.forEach(async (i) => {
        promises[i.slug] = {
          ...((await MiniMeals.findOne({ slug: i.slug }).then((d) => d)) ?? {}),
          ...(i ?? {}),
        };
      });
    } else {
      await items.forEach(async (values, keys) => {
        await values.forEach(async (value, key) => {
          promises[key] = {
            ...((await Items.findOne({ slug: key }).then((d) => d)) ?? {}),
            ...(items[i] ?? {}),
          };
        });
      });
    }
    return promises;
  } catch (err) {
    return err;
  }
}

module.exports = { findItems };
