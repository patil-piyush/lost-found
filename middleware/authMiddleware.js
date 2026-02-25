// middleware/authMiddleware.js

// middleware/authMiddleware.js

exports.isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  // CHANGE: Redirect to login instead of sending JSON 401
  res.redirect('/login');
};

// Note: We won't use isOwner for simple form actions to avoid complexity, 
// but if you keep it, make sure it redirects too.

exports.isOwner = (model) => async (req, res, next) => {
  const item = await model.findById(req.params.id);

  if (!item) return res.status(404).json({ message: "Not found" });

  if (item.postedBy.toString() !== req.session.userId) {
    return res.status(403).json({ message: "Not authorized" });
  }

  next();
};