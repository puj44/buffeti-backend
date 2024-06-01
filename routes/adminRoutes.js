const express = require('express');
const router =  express.Router();
const authentication = require('../admin/controllers/authenticationController');
const { adminRequests } = require('../admin/requests/adminRequests');
const validator = require("../middlewares/validator");
const { uploadFile } = require('../admin/controllers/fileController');
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({storage:storage})

//all Admin Routes
router.post("/sign-in",validator(adminRequests.signin),authentication.signin);
router.post("/csv-upload",upload.single("file"),uploadFile);


module.exports = router;


