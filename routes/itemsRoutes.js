const express = require('express');
const router = express.Router();
const validator = require("../middlewares/validator/validator");
const { getItems} = require('../controllers/itemController');
const { itemRequests } = require('../middlewares/requests/itemRequests');
const slugs = require('../middlewares/validator/slugs');
const validateLocation = require('../middlewares/validateLocation');


router.get(`/items/:menuOption(${slugs.menuOption})/:category`,validateLocation ,validator(itemRequests.getItems, true) ,getItems);

module.exports = router;