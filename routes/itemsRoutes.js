const express = require('express');
const router = express.Router();
const validator = require("../middlewares/validator/validator");
const { getItems, getCategories} = require('../controllers/itemController');
const { itemRequests } = require('../middlewares/requests/itemRequests');
const slugs = require('../middlewares/validator/slugs');


router.get(`/get-categories/:menuOption(${slugs.itemsMenuOption})` ,getCategories);
router.get(`/get-items/:menuOption(${slugs.itemsMenuOption})/:category` ,validator(itemRequests.getItems, true) ,getItems);

module.exports = router;