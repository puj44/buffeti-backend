const customerRoutes = require("./customerRoutes");
const authRoutes = require("./authenticationRoutes")
const express = require('express');
const router = express.Router();

// Middleware to log requests
// router.use((req, res, next) => {
//     console.log('Request received:', req.method, req.url);
//     next();
// });

//routes
router.use("/customers",customerRoutes);
router.use("/auth",authRoutes);

router.use("/", (req,res) => {
    res.status(404).send("Route not defined!");
})

module.exports = function(app) {
    app.use('/api/v1', router);
};