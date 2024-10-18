const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // Get the token from cookies
    const token = req.cookies.token;
    console.log(token);

    // Check if token exists
    if (!token) {
      return handleAuthError(req, res, "Token Expired. Please Log in.");
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to the request object
    req.user = decoded; // Contains userId and email

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Invalid token:", error);
    return handleAuthError(req, res, "Invalid or expired tokens.");
  }
};

// Utility function to handle different types of errors based on request type
function handleAuthError(req, res, message) {
  const responseMessage = {
    message: message,
    type: "error",
  };
  // Check if the request expects HTML or JSON
  if (req.headers.accept && req.headers.accept.includes("text/html")) {
    // If it's an SSR request, render the login page (or another appropriate page)
    return res.status(401).render("index", responseMessage);
  } else {
    // If it's an API request, respond with JSON
    return res.status(401).json(responseMessage);
  }
}

module.exports = authMiddleware;
