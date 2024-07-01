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

async function calculateItems(data, itemsData) {
  let additional_qty = null,
    extra_items = null,
    preparation = null,
    total_price = 0,
    addon_charges = 0,
    items_id,
    itemObj = {};

  console.log(data.menu_option);
  if (
    data.items &&
    data.location &&
    data.menu_option &&
    itemsData &&
    data.no_of_people
  ) {
    switch (data.menu_option) {
      case "click2cater":
        data.items.forEach((values, keys) => {
          values.forEach(async (value, key) => {
            additional_qty = value?.additional_qty;
            extra_items = value?.added_extra_items;
            preparation = value?.selected_preparation;
            extra_items_cache =
              extra_items !== null
                ? await get(
                    `${data.location}_${data.menu_option}_${keys.extra_items}`,
                    true
                  )
                : null;

            Object.keys(itemsData).forEach((i) => {
              if (itemsData[i].slug === key) {
                if (additional_qty) {
                  items_id = itemsData[i]._id;
                  addon_charges =
                    addon_charges +
                    itemsData[i].additional_serving_rate * additional_qty;
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
              total_price = itemsData[i].rate_per_serving * data.no_of_people;
            }

            total_price += addon_charges;

            itemObj[key] = {
              item_id: items_id,
              additional_qty: additional_qty,
              added_extra_items: extra_items,
              selected_preparation: preparation,
              addon_charges: addon_charges,
              total_price: total_price,
            };
          });
        });

        break;

      case "snack-boxes":
        data.items.forEach((values, keys) => {
          values.forEach(async (value, key) => {
            console.log(key);
            Object.keys(itemsData).forEach((i) => {
              if (itemsData[i].slug === key) {
                items_id = itemsData[i]._id;
                total_price =
                  total_price +
                  itemsData[i].rate_per_serving * data.no_of_people;
              }
            });
            itemObj[key] = {
              item_id: items_id,
              additional_qty: additional_qty,
              added_extra_items: extra_items,
              selected_preparation: preparation,
              addon_charges: addon_charges,
              total_price: total_price,
            };
          });
        });

        break;
      case "mini-meals":
        data.items.forEach((values, keys) => {
          values.forEach(async (value, key) => {
            Object.keys(itemsData).forEach((i) => {
              if (itemsData[i].slug === key) {
                items_id = itemsData[i]._id;
                total_price =
                  total_price + itemsData[i].price * data.no_of_people;
              }
            });
            itemObj[key] = {
              item_id: items_id,
              additional_qty: additional_qty,
              added_extra_items: extra_items,
              selected_preparation: preparation,
              addon_charges: addon_charges,
              total_price: total_price,
            };
          });
        });
        break;
    }
    return itemObj;
  } else {
    return sendRes(res, 500, {
      message: "Couldn't find data",
    });
  }

  return itemObj;
}

module.exports = {
  validatePackage,
  calculateItems,
};
