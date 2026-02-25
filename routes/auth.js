// routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashedPassword });
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.redirect("/register"); // Simple error handling
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) return res.redirect("/login"); // Invalid email

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.redirect("/login"); // Invalid password

    req.session.userId = user._id;
    req.session.role = user.role; // Save role
    res.redirect("/dashboard");
    
  } catch(e) {
      res.redirect("/login");
  }
});

// Logout
router.get("/logout", (req, res) => { // Changed to GET for easier linking
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;