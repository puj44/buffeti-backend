const express = require('express');
const router = express.Router();
const { addtocart} = require('../controllers/cartController');

router.post("/add-to-cart",addtocart);


module.exports = router;