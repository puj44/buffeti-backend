const { get } = require("./redisGetterSetter");
const keys = require("../config/keys");

async function validatePackage(items, isValidPackage, packages) {
  let values,
    categoriesMapings = packages.categories_mapping;

  Object.keys(categoriesMapings).forEach((c) => {
    if (!items[c]) {
      isValidPackage = false;
    } else {
      values = items[c];
      if (categoriesMapings[c] !== Object.keys(values).length) {
        isValidPackage = false;
      }
    }
  });

  return isValidPackage;
}

async function calculateItems(data) {
  let additional_qty,
    extra_items,
    preparation,
    total_price = 0,
    addon_charges = 0,
    items_id,
    itemObj;

  switch (data.menu_option) {
    case "click2cater":
      {
      }
      break;

    case "snack-Boxes":
      {
      }
      break;
    case "mini-meals":
      {
      }
      break;
  }

  Object.keys(data.items).forEach((category) => {
    Object.keys(data.items[category]).forEach(async (item) => {
      additional_qty = data.items[category][item]?.additional_qty;
      extra_items = data.items[category][item]?.added_extra_items;
      preparation = data.items[category][item]?.selected_preparation;
      extra_items_cache =
        extra_items !== null
          ? await get(
              `${data.location}_${data.menu_option}_${keys.extra_items}`,
              true
            )
          : null;

      Object.keys(data.itemsData).forEach((i) => {
        if (data.itemsData[i].slug === item) {
          if (additional_qty) {
            items_id = data.itemsData[i]._id;
            addon_charges =
              addon_charges +
              data.itemsData[i].additional_serving_rate * additional_qty;
          }
        }
      });

      if (extra_items) {
        Object.keys(extra_items_cache).forEach((ec) => {
          Object.keys(extra_items).forEach((e) => {
            if (extra_items_cache[ec].slug === e) {
              addon_charges =
                addon_charges +
                extra_items_cache[ec].rate_per_serving * extra_items[e];
            }
          });
        });
      }

      if (data.isValidPackage === false) {
        total_price = data.itemsData[i].rate_per_serving * no_of_people;
      }

      total_price += addon_charges;

      itemObj[item] = {
        item_id: items_id,
        additional_qty: additional_qty,
        added_extra_items: extra_items,
        selected_preparation: selected_preparation,
        addon_charges: addon_charges,
        total_price: total_price,
      };
    });
  });

  return itemObj;
}

module.exports = {
  validatePackage,
  calculateItems,
};
