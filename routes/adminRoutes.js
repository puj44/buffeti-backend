const express = require("express");
const router = express.Router();
const {
  uploadFile,
  uploadImages,
} = require("../admin/controllers/fileController");
const multer = require("multer");
const authenticateUser = require("../middlewares/authenticateUser");
const orderRoutes = require("./adminRoutes/orderRoutes");
const authRoutes = require("./adminRoutes/authenticationRoutes");
const customerRoutes = require("./adminRoutes/customerRoutes");
const { convertToSlug } = require("../admin/common/convertToSlug");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { menu_option, type } = req.body;
    const uploadPath = path.join(
      __dirname,
      `../public/images/${menu_option}/${type}`
    );
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname;
    const baseName =
      originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
    const fileName = convertToSlug(baseName);
    // const ext = path.extname(file.originalname);
    cb(null, `${fileName}.webp`);
  },
});
const upload = multer({ storage: storage });
const memoryStorage = multer.memoryStorage();
const memoryUpload = multer({ storage: memoryStorage });
//all Admin Routes

router.post("/csv-upload", authenticateUser, memoryUpload.single("file"), uploadFile);
router.use("/order", authenticateUser, orderRoutes);
router.use("/customers", authenticateUser, customerRoutes);
router.use("/auth", authRoutes);
router.post(
  "/image-upload",
  authenticateUser,
  upload.array("files", 100),
  uploadImages
);

module.exports = router;
