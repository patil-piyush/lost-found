// app.js
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");

const User = require("./models/User");
const Item = require("./models/Item");
const authRoutes = require("./routes/auth");
const itemRoutes = require("./routes/items"); // The file we just fixed

const app = express();

// Settings
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true })); // For Forms
app.use(express.json());
app.use(express.static("public"));

// Session
app.use(session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: false,
}));

// User Loader Middleware
app.use(async (req, res, next) => {
    res.locals.currentUser = null;
    if (req.session.userId) {
        try {
            res.locals.currentUser = await User.findById(req.session.userId);
        } catch (e) { console.error(e); }
    }
    next();
});

// --- ROUTES ---

// 1. Auth Actions (Login/Register/Logout logic)
app.use("/", authRoutes);

// 2. Item Actions (Create/Delete/Claim logic)
app.use("/items", itemRoutes); 

// --- VIEW ROUTES (PAGES) ---

// Home
app.get("/", (req, res) => res.render("index"));

// Login & Register Pages
app.get("/login", (req, res) => res.render("login"));
app.get("/register", (req, res) => res.render("register"));

// Dashboard (Protected)
// Dashboard (With Filtering)
app.get("/dashboard", async (req, res) => {
    if (!res.locals.currentUser) return res.redirect("/login");

    const { status } = req.query; // Get ?status=Lost from URL
    let query = {};

    // Apply filter if a valid status is clicked
    if (status && ["Lost", "Found"].includes(status)) {
        query.status = status;
    }

    // sort by newest first
    const items = await Item.find(query).sort({ createdAt: -1 });
    res.render("dashboard", { items, currentFilter: status || 'All' });
});

// My Items (Protected)
app.get("/my-items", async (req, res) => {
    if (!res.locals.currentUser) return res.redirect("/login");
    
    const items = await Item.find({ postedBy: req.session.userId }).sort({ createdAt: -1 });
    res.render("my-items", { items });
});

// Create Item Page (Protected)
app.get("/items/new", (req, res) => {
    if (!res.locals.currentUser) return res.redirect("/login");
    res.render("create-item");
});

// Start
mongoose.connect("mongodb://127.0.0.1:27017/lostfound")
    .then(() => {
        app.listen(5000, () => console.log("Server running on port 5000"));
    })
    .catch(err => console.log(err));