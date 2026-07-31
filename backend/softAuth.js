// softAuth.js
// Optional auth — agar valid token ho to req.userId set ho jaata hai, warna
// (guest ho ya token expire ho gaya ho) bina block kiye aage badhne deta hai.
// Isse image-generate guest ke liye bhi chalta rehta hai, sirf gallery ke
// liye asli authMiddleware (jo strictly block karta hai) use hoga.

const jwt = require('jsonwebtoken');

function softAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
      req.userId = decoded.userId;
    } catch (e) {
      req.userId = null; // invalid/expired token — guest jaisa treat karo
    }
  } else {
    req.userId = null;
  }
  next();
}

module.exports = softAuth;