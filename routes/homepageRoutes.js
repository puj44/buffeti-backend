const express = require('express');
const router = express.Router();
const validator = require("../middlewares/validator");
const { getMenuOptions } = require('../controllers/homepageController');

router.get("/menu-options",getMenuOptions);

module.exports = router;