// routes/items.js
const express = require("express");
const Item = require("../models/Item");
const { isAuthenticated } = require("../middleware/authMiddleware");

const router = express.Router();

// 1. CREATE Item (POST /items)
router.post("/", isAuthenticated, async (req, res) => {
  try {
    await Item.create({
      ...req.body,
      postedBy: req.session.userId,
    });
    // CHANGE: Redirect back to dashboard
    res.redirect("/dashboard");
  } catch (err) {
    console.log(err);
    res.redirect("/items/new");
  }
});

// 2. DELETE Item (POST /items/:id/delete)
// We use POST because HTML forms don't support DELETE natively without method-override
router.post("/:id/delete", isAuthenticated, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    // Simple ownership check
    if (item && item.postedBy.toString() === req.session.userId) {
        await Item.findByIdAndDelete(req.params.id);
    }
    res.redirect("/my-items");
  } catch (err) {
    console.log(err);
    res.redirect("/dashboard");
  }
});

// 3. CLAIM Item (POST /items/:id/claim)
router.post("/:id/claim", isAuthenticated, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    // Prevent claiming your own item
    if (item && item.postedBy.toString() !== req.session.userId) {
        item.status = "Claim Requested";
        item.claimant = req.session.userId;
        await item.save();
    }
    res.redirect("/dashboard");
  } catch (err) {
    console.log(err);
    res.redirect("/dashboard");
  }
});



// ... existing imports ...

// 1. APPROVE CLAIM (Owner accepts the claim)
router.post("/:id/approve", isAuthenticated, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    // Security: Only the owner can approve
    if (item.postedBy.toString() !== req.session.userId) {
        return res.redirect("/dashboard");
    }

    item.status = "Resolved";
    await item.save();
    res.redirect("/my-items"); // Go back to manage page
  } catch (err) {
    console.log(err);
    res.redirect("/my-items");
  }
});

// 2. REJECT CLAIM (Owner denies the claim)
router.post("/:id/reject", isAuthenticated, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (item.postedBy.toString() !== req.session.userId) {
        return res.redirect("/dashboard");
    }

    // Reset status back to Lost or Found (You might want to store the original status, 
    // but for now let's assume if it was a claim, it goes back to 'Lost')
    // A safer way is to check the item type or just ask the user. 
    // For simplicity, we default to "Lost" or "Found" based on logic, or just "Open".
    // Let's assume most claims are on "Found" items, but let's just reset to "Found".
    // OR better: Check context. For now, let's reset to "Found" if it was found, "Lost" if lost.
    
    // Simple logic: If I found a bag, and someone claimed it but was lying, it is still "Found".
    // If I lost a bag, and someone said "I found it" (claim), it is still "Lost".
    // Since your model doesn't strictly separate "Post Type" from "Status", let's guess:
    
    // We will reset it to 'Found' as that is the most common flow (Claiming a found item)
    // You can improve this by adding a separate 'type' field to your model later.
    item.status = "Found"; 
    item.claimant = null; // Remove the claimant
    await item.save();

    res.redirect("/my-items");
  } catch (err) {
    console.log(err);
    res.redirect("/my-items");
  }
});


module.exports = router;