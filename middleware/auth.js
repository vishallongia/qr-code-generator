const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // Get the token from cookies
    const token = req.cookies.token;

    // Check if token exists
    if (!token && req.path !== "/") {
      return handleAuthError(req, res, "Token is missing. Please log in.");
    }

    if (token) {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user info to the request object
      req.user = decoded; // Contains userId and email
    }

    // If the user is authenticated and requests the "/" path (SSR), redirect to "/dashboard"
    if (req.path === "/" && req.user) {
      return res.redirect("/dashboard");
    }

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);

    // Handle specific JWT errors (e.g., expired token)
    if (error.name === "TokenExpiredError") {
      return handleAuthError(req, res, "Token expired. Please log in again.");
    } else if (error.name === "JsonWebTokenError") {
      return handleAuthError(req, res, "Invalid token. Please log in again.");
    } else {
      return handleAuthError(req, res, "Authentication error. Please log in.");
    }
  }
};

// Utility function to handle different types of errors based on request type
function handleAuthError(req, res, message) {
  const responseMessage = {
    message: message,
    type: "error",
  };

  // Check if the request expects HTML or JSON
  const acceptHeader = req.headers.accept || ""; // Ensure this doesn't break if accept header is missing
  if (acceptHeader.includes("text/html")) {
    // If it's an SSR request, render the login page (or another appropriate page)
    return res.status(401).render("index", responseMessage);
  } else {
    // If it's an API request, respond with JSON
    return res.status(401).json(responseMessage);
  }
}

module.exports = authMiddleware;
