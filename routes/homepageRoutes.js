const express = require('express');
const router = express.Router();
const validator = require("../middlewares/validator/validator");
const { getMenuOptions,getPackages, getHomeData, getFilters } = require('../controllers/homepageController');
const { homeRequests } = require('../middlewares/requests/homeRequests');
const slugs = require('../middlewares/validator/slugs');
const validateLocation = require('../middlewares/validateLocation');

router.get("/menu-options",getMenuOptions);
router.get("/get-data",getHomeData);
router.get(`/get-packages/:menuOption(${slugs.menuOption})`,validateLocation ,validator(homeRequests.getPackages, true) ,getPackages);
router.get(`/get-filters/:menuOption(${slugs.menuOption})`,validateLocation ,getFilters);

module.exports = router;