const express = require('express');
const router = express.Router();
const validator = require("../middlewares/validator/validator");
const slugs = require('../middlewares/validator/slugs');
const validateLocation = require('../middlewares/validateLocation');
const { packageRequests } = require('../middlewares/requests/packageRequests');
const { getPackages, getFilters } = require('../controllers/packagesControllers');

router.get(`/get-packages/:menuOption(${slugs.menuOption})`,validateLocation ,validator(packageRequests.getPackages, true) ,getPackages);
router.get(`/get-filters/:menuOption(${slugs.menuOption})`,validateLocation  ,getFilters);


module.exports = router;