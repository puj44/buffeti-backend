const express = require('express');
const router = express.Router();
const validator = require("../middlewares/validator/validator");
const { getMenuOptions,getPackages } = require('../controllers/homepageController');
const { homeRequests } = require('../middlewares/requests/homeRequests');
const slugs = require('../middlewares/validator/slugs');

router.get("/menu-options",getMenuOptions);
router.get(`/get-packages/:menuOption(${slugs.menuOption})`,validator(homeRequests.getPackages, false,true) ,getPackages);

module.exports = router;