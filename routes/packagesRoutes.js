const express = require('express');
const router = express.Router();
const validator = require("../middlewares/validator/validator");
const slugs = require('../middlewares/validator/slugs');
const validateLocation = require('../middlewares/validateLocation');
const { packageRequests } = require('../middlewares/requests/packageRequests');
const { getPackages, getFilters, getPackage } = require('../controllers/packagesControllers');

router.get(`/get-package/:menuOption(${slugs.menuOption})/:packageSlug` ,getPackage);
router.get(`/get-packages/:menuOption(${slugs.menuOption})`,validator(packageRequests.getPackages, true) ,getPackages);
router.get(`/get-filters/:menuOption(${slugs.menuOption})`,getFilters);


module.exports = router;