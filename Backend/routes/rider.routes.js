const express = require("express");
const router = express.Router();
const riderController = require("../controllers/rider.controller");
const { body } = require("express-validator");
const { authRider } = require("../middlewares/auth.middleware");

router.post("/register",
    body("email").isEmail().withMessage("Invalid Email"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
    body("phone").isLength({ min: 10, max: 10 }).withMessage("Phone Number should be of 10 characters only"),
    body("fullname.firstname").isLength({min:3}).withMessage("First name must be at least 3 characters long"),
    riderController.registerRider
);

router.post("/verify-email", riderController.verifyEmail);

router.post("/login", 
    body("email").isEmail().withMessage("Invalid Email"),
    riderController.loginRider
);

router.post("/update", 
    body("riderData.phone").isLength({ min: 10, max: 10 }).withMessage("Phone Number should be of 10 characters only"),
    body("riderData.fullname.firstname").isLength({min:2}).withMessage("First name must be at least 2 characters long"),
    authRider,
    riderController.updateRiderProfile
);

router.get("/profile", authRider, riderController.riderProfile);

router.get("/logout", authRider, riderController.logoutRider);

router.post(
    "/reset-password",
    body("token").notEmpty().withMessage("Token is required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
    riderController.resetPassword
);

module.exports = router;
