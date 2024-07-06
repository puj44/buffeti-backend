const DeliveryFees = require("../models/deliveryFees");
const menuOptions = require("../models/menuOptions");
const mongoose = require("mongoose");
const users = require("../models/users");
const Locations = require("../models/locations");
const { ExtraServices } = require("../models/extraServices");
require("dotenv").config();

const menuOptionsData = [
  {
    name: "Click2Cater",
    slug: "click2cater",
  },
  {
    name: "Snack Boxes",
    slug: "snack-boxes",
  },
  {
    name: "Mini Meals",
    slug: "mini-meals",
  },
];

const deliveryFeesData = [
  {
    min: 0,
    max: 5,
    fees: 0,
    location: "ahmedabad",
  },
  {
    min: 5,
    max: 10,
    fees: 199,
    location: "ahmedabad",
  },
  {
    min: 10,
    max: 20,
    fees: 299,
    location: "ahmedabad",
  },
  {
    min: 20,
    max: 30,
    fees: 399,
    location: "ahmedabad",
  },
  {
    min: 30,
    max: undefined,
    fees: 499,
    location: "ahmedabad",
  },
];

const locations = [
  {
    location: "ahmedabad",
  },
];

const extraServicesData = [
  {
    slug: "waiters-and-servers",
    name: "Waiters and Servers",
    price: 1000,
  },
  {
    slug: "post-party-cleanup",
    name: "Post party cleanup",
    price: 1000,
  },
  {
    slug: "add-disposables-cutlery",
    name: "Add Disposables & Cutlery",
    price: 1000,
  },
];

const couponCode = [
  {
    coupon_code: "GET5",
    discount_value: 5,
    discount_type: null,
    description: "Get 5% off",
    is_active: true,
  },
];

async function SeedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    await Locations.deleteMany({});
    await Locations.insertMany(locations)
      .then((d) => d)
      .catch((err) => console.log("Locations: ", err));

    await menuOptions.deleteMany({});
    await menuOptions
      .insertMany(menuOptionsData)
      .then((d) => d)
      .catch((err) => console.log("Menu Options: ", err));

    await DeliveryFees.deleteMany({});
    await DeliveryFees.insertMany(deliveryFeesData)
      .then((d) => d)
      .catch((err) => console.log("Delivery Fees: ", err));

    await users.deleteOne({ email: "pujan007mm@gmail.com" });
    await users
      .create({
        email: "pujan007mm@gmail.com",
        password: process.env.DEFAULT_ADMIN_PASSWORD,
        name: "Super Admin",
        is_super_admin: true,
      })
      .then((d) => d)
      .catch((err) => console.log("Admin Users: ", err));

    await ExtraServices.deleteMany({});
    await ExtraServices.insertMany(extraServicesData)
      .then((d) => d)
      .catch((err) => console.log("Delivery Fees: ", err));

    process.exit(0);
  } catch (err) {
    console.log("Seed error:", err);
    process.exit(1);
  }
}

SeedDatabase();
