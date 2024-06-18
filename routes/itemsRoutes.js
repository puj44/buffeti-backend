const express = require('express');
const router = express.Router();
const validator = require("../middlewares/validator/validator");
const { getItems, getCategories} = require('../controllers/itemController');
const { itemRequests } = require('../middlewares/requests/itemRequests');
const slugs = require('../middlewares/validator/slugs');
const validateLocation = require('../middlewares/validateLocation');


router.get(`/get-categories/:menuOption(${slugs.menuOption})` ,getCategories);
router.get(`/get-items/:menuOption(${slugs.menuOption})/:category` ,validator(itemRequests.getItems, true) ,getItems);

module.exports = router;