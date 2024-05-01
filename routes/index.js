const customerRoutes = require("./customerRoutes");
const express = require('express');
const router = express.Router();

// Middleware to log requests
// router.use((req, res, next) => {
//     console.log('Request received:', req.method, req.url);
//     next();
// });

//customer route
router.use("/customers",customerRoutes);

router.use("/", (req,res) => {
    res.status(404).send("Route not defined");
})

module.exports = function(app) {
    app.use('/api/v1', router);
};