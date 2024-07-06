const express = require('express');
const router = express.Router();
const { getMenuOptions, getHomeData } = require('../controllers/homepageController');

router.get("/menu-options",getMenuOptions);
router.get("/get-data",getHomeData);

module.exports = router;