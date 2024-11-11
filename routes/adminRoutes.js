const express = require("express");
const router = express.Router();
const { uploadFile } = require("../admin/controllers/fileController");
const multer = require("multer");
const authenticateUser = require("../middlewares/authenticateUser");
const orderRoutes = require("./adminRoutes/orderRoutes");
const authRoutes = require("./adminRoutes/authenticationRoutes");
const customerRoutes = require("./adminRoutes/customerRoutes");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//all Admin Routes

router.post("/csv-upload", authenticateUser, upload.single("file"), uploadFile);
router.use("/order", authenticateUser, orderRoutes);
router.use("/customers", authenticateUser, customerRoutes);
router.use("/auth", authRoutes);

module.exports = router;
