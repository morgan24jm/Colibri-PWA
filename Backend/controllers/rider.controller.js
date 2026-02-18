const asyncHandler = require("express-async-handler");
const riderModel = require("../models/rider.model");
const riderService = require("../services/rider.service");
const { validationResult } = require("express-validator");
const blacklistTokenModel = require("../models/blacklistToken.model");
const jwt = require("jsonwebtoken");

module.exports.registerRider = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { fullname, email, password, phone, vehicle } = req.body;

  const alreadyExists = await riderModel.findOne({ email });

  if (alreadyExists) {
    return res.status(400).json({ message: "Rider already exists" });
  }

  const rider = await riderService.createRider(
    fullname.firstname,
    fullname.lastname,
    email,
    password,
    phone,
    vehicle.color,
    vehicle.number,
    vehicle.capacity,
    vehicle.type
  );

  const token = rider.generateAuthToken();
  res
    .status(201)
    .json({ message: "Rider registered successfully", token, rider });
});

module.exports.verifyEmail = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Invalid verification link", error: "Token is required" });
    }
  
    let decodedTokenData = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedTokenData || decodedTokenData.purpose !== "email-verification") {
      return res.status(400).json({ message: "You're trying to use an invalid or expired verification link", error: "Invalid token" });
    }
  
    let rider = await riderModel.findOne({ _id: decodedTokenData.id });
  
    if (!rider) {
      return res.status(404).json({ message: "User not found. Please ask for another verification link." });
    }
  
    if (rider.emailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }
  
    rider.emailVerified = true;
    await rider.save();
  
    res.status(200).json({
      message: "Email verified successfully",
    });
});

module.exports.loginRider = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { email, password } = req.body;

  const rider = await riderModel.findOne({ email }).select("+password");
  if (!rider) {
    res.status(404).json({ message: "Invalid email or password" });
  }

  const isMatch = await rider.comparePassword(password);

  if (!isMatch) {
    return res.status(404).json({ message: "Invalid email or password" });
  }

  const token = rider.generateAuthToken();
  res.cookie("token", token);
  res.json({ message: "Logged in successfully", token, rider });
});

module.exports.riderProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ rider: req.rider });
});

module.exports.updateRiderProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { riderData } = req.body;
  const updatedRiderData = await riderModel.findOneAndUpdate(
    { email: req.rider.email },
    riderData,
    { new: true }
  );

  res.status(200).json({
    message: "Profile updated successfully",
    user: updatedRiderData,
  });
});

module.exports.logoutRider = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  const token = req.cookies.token || req.headers.token;

  await blacklistTokenModel.create({ token });

  res.status(200).json({ message: "Logged out successfully" });
});

module.exports.resetPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { token, password } = req.body;
  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "This password reset link has expired or is no longer valid. Please request a new one to continue" });
    } else {
      return res.status(400).json({ message: "The password reset link is invalid or has already been used. Please request a new one to proceed", error: err });
    }
  }

  const rider = await riderModel.findById(payload.id);
  if (!rider) return res.status(404).json({ message: "User not found. Please check your credentials and try again" });

  rider.password = await riderModel.hashPassword(password);
  await rider.save();

  res.status(200).json({ message: "Your password has been successfully reset. You can now log in with your new credentials" });
});
