const express = require('express');
const router = express.Router();
const { addtocart} = require('../controllers/cartController');

router.get("/add-to-cart",addtocart);


module.exports = router;