const customerRoutes = require("./customerRoutes");
const authRoutes = require("./AuthenticationRoutes");
const adminRoutes = require("./adminRoutes");
const homeRoutes = require("./homepageRoutes");
const itemRoutes = require("./itemsRoutes");
const packageRoutes = require("./packagesRoutes");
const cartRoutes = require("./cartRoutes");
const orderRoutes = require("./orderRoutes");
const profileRoutes = require("./profileRoutes");
const paymentRoutes = require("./paymentRoutes");
const locationRoutes = require("./locationRoutes");
const express = require("express");
const validateLocation = require("../middlewares/validateLocation");
const authenticateUser = require("../middlewares/authenticateUser");
const router = express.Router();

// Middleware to log requests
// router.use((req, res, next) => {
//     console.log('Request received:', req.method, req.url);
//     next();
// });

//routes
router.use("/admin", adminRoutes);
router.use("/customers", customerRoutes);
router.use("/auth", authRoutes);
router.use("/home", homeRoutes);
router.use("/items", validateLocation, itemRoutes);
router.use("/packages", validateLocation, packageRoutes);
router.use("/cart", authenticateUser, cartRoutes);
router.use("/order", authenticateUser, orderRoutes);
router.use("/profile", authenticateUser, profileRoutes);
router.use("/payment", paymentRoutes);
router.use("/geolocation", locationRoutes);

router.use("/", (req, res) => {
  res.status(404).send("Route not defined!");
});

module.exports = function (app) {
  app.use("/api/v1", router);
};
