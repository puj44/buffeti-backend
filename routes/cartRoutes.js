const express = require('express');
const router = express.Router();
const validator = require("../middlewares/validator/validator");
const slugs = require('../middlewares/validator/slugs');
const { cartRequests } = require('../middlewares/requests/cartRequests');
const { addtocart} = require('../controllers/cartControllers');

router.get("/add-to-cart",validator(cartRequests.addtocart, true) ,addtocart);
router.get(`/get-filters/:menuOption(${slugs.menuOption})`,getFilters);


module.exports = router;