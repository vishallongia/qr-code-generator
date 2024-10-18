const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth"); // Import the middleware
const QRCodeData = require("../models/QRCode"); // Adjust the path as necessary
const qr = require("qrcode");
const multer = require("multer");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

// Home route
router.get("/", async (req, res) => {
  try {
    res.render("index"); // Send type as 'success'
  } catch (error) {
    console.error("Error generating QR code:", error);
    res.status(500).render("index", {
      message: "Failed to generate QR code",
      type: "error", // Send type as 'error'
    });
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid email or password", type: "error" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid email or password", type: "error" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    // Set token and user ID in cookies
    res.cookie("token", token, { httpOnly: false, maxAge: 3600000 }); // Expires in 1 hour
    res.cookie("userId", user._id.toString(), {
      httpOnly: false,
      maxAge: 3600000,
    });

    res
      .status(200)
      .json({ message: "Login successful", token, type: "success" });
  } catch (error) {
    console.error("Error during login:", error);
    res
      .status(500)
      .json({ message: "An error occurred during login", type: "error" });
  }
});

// Registration Route
router.post("/register", async (req, res) => {
  const { fullName, email, password, confirmPassword } = req.body;

  // Validate passwords
  if (password !== confirmPassword) {
    return res.status(400).json({
      message: "Passwords do not match",
      type: "error",
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already in use",
        type: "error", // Send type as 'error'
      });
    }

    // Hash the password and save user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fullName, email, password: hashedPassword });
    await newUser.save();

    // Render success message
    res.status(201).json({
      message: "Registration successful!",
      type: "success", // Send type as 'success'
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({
      message: "An error occurred during registration",
      type: "error", // Send type as 'error'
    });
  }
});

// Home route
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const message = "Welcome!"; // Example message
    res.render("dashboard", {
      message,
      type: "error", // Send type as 'error'
    }); // Send type as 'success'
  } catch (error) {
    console.error("Error generating QR code:", error);
    res.status(500).render("index", {
      message: "Failed to generate QR code",
      type: "error", // Send type as 'error'
    });
  }
});

// Set up multer for file uploads
const upload = multer({ dest: "uploads/" });

// Function to generate a unique ID
function generateUniqueId() {
  return Math.random().toString(36).substring(2, 8) + Date.now().toString(36);
}
function generateAlphanumericCode(length = 6) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

router.post(
  "/generate",
  authMiddleware,
  upload.fields([
    { name: "media-file", maxCount: 1 },
    { name: "text-file", maxCount: 1 },
  ]),
  async (req, res) => {
    const { type } = req.body; // Ensure user_id and type are sent in the request body
    const user_id = req.cookies.userId;
    let url;

    try {
      // Set the URL to the desired link (e.g., Facebook)
      url = "https://www.facebook.com"; // Link to append to the generated QR code

      // Handle media and text file uploads
      let mediaFilePath;
      let textFilePath;

      if (type === "media") {
        // Check if media file is attached
        if (!req.files["media-file"]) {
          return res
            .status(400)
            .json({ message: "Media file not attached", type: "error" });
        }
        mediaFilePath = req.files["media-file"][0].path; // Path to uploaded media file
      } else if (type === "text") {
        // Check if text file is attached
        if (!req.files["text-file"]) {
          return res
            .status(400)
            .json({ message: "Text file not attached", type: "error" });
        }
        textFilePath = req.files["text-file"][0].path; // Path to uploaded text file
      } else if (type === "url") {
        // Validate URL
        const url = req.body.url;

        if (!url) {
          return res
            .status(400)
            .json({ message: "Url is missing", type: "error" });
        }
      } else {
        return res.status(400).json({ message: "Invalid type", type: "error" });
      }

      // Generate a unique filename for the QR code
      const qrCodeFilename = `${generateUniqueId()}.png`;
      const qrCodeImagePath = path.join(
        __dirname,
        "../qr_images",
        qrCodeFilename
      ); // Full path to save the QR code image

      // Generate and save the QR code image
      await qr.toFile(qrCodeImagePath, url); // Use the updated URL for the QR code

      // Generate the 6-digit alphanumeric code
      const alphanumericCode = generateAlphanumericCode();

      // Save QR code data to the database
      const qrCode = new QRCodeData({
        user_id,
        type,
        url,
        qr_image: `/qr_images/${qrCodeFilename}`, // Store the URL path to access the image
        code: alphanumericCode, // Add the generated code here
      });

      // Save additional media or text file paths if applicable
      if (type === "media") {
        qrCode.media_url = mediaFilePath; // Save media file path
      } else if (type === "text") {
        qrCode.text_url = textFilePath; // Save text file path
      }

      await qrCode.save();

      // Send a response back to the client
      res.status(201).json({
        message: "QR Code generated successfully.",
        qrCode: {
          id: qrCode._id,
          user_id,
          type,
          url,
          qr_image: qrCode.qr_image, // The stored URL path to the QR image
          code: alphanumericCode, // Return the generated code in the response
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error generating QR code." });
    }
  }
);

module.exports = router;
