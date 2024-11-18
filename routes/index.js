require("dotenv").config(); // Load environment variables
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth"); // Import the middleware
const QRCodeData = require("../models/QRCODEDATA"); // Adjust the path as necessary
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const MAX_FILE_SIZE = 50 * 1024 * 1024; // Max Size of media file 50 MB in bytes
// Set up multer for file uploads with custom storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Destination folder
  },
  filename: (req, file, cb) => {
    // Generate a unique ID for the filename
    const uniqueId = generateUniqueId(); // Call your unique ID function
    const ext = path.extname(file.originalname); // Extract the file extension
    const newFilename = `${uniqueId}${ext}`; // Combine unique ID and extension
    cb(null, newFilename); // Save with new filename
  },
});

// Initialize multer with custom storage and file size limit
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE }, // Set file size limit
});

// Error handler middleware to catch multer errors
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res
      .status(400)
      .json({ message: "File size should not exceed 50 MB", type: "error" });
  } else if (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "File upload error", type: "error" });
  }
  next();
};

// Function to generate a unique ID
function generateUniqueId() {
  return Math.random().toString(36).substring(2, 8) + Date.now().toString(36);
}

//All Routes

// Home route
router.get("/", authMiddleware, async (req, res) => {
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
      { expiresIn: process.env.JWT_EXPIRATION }
    );
    // Set token and user ID in cookies

    res.cookie("token", token, {
      httpOnly: false,
      maxAge: Number(process.env.COOKIE_EXPIRATION),
    }); // Expires in 1 hour
    // res.cookie("userId", user._id.toString(), {
    //   httpOnly: false,
    //   maxAge: 3600000,
    // });

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

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already in use",
        type: "error",
      });
    }

    // Hash the password and save user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fullName, email, password: hashedPassword });
    await newUser.save();

    // Generate JWT token for the new user
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    // Set token in cookies
    res.cookie("token", token, {
      httpOnly: false,
      maxAge: Number(process.env.COOKIE_EXPIRATION),
    }); // Expires in 1 hour

    // Send success response with token
    res.status(201).json({
      message: "Registration successful!",
      token,
      type: "success",
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({
      message: "An error occurred during registration",
      type: "error",
    });
  }
});

// Home route
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId; // Assuming the auth middleware adds the user object to the request
    const { updateqr } = req.query; // Get the updateqr query parameter, if any

    // Check if specific QR code ID is requested for updating
    if (updateqr) {
      // Fetch the specific QR code by ID and ensure it belongs to the logged-in user
      const qrCode = await QRCodeData.findOne({
        _id: updateqr,
        user_id: userId,
      });

      if (qrCode) {
        // If QR code is found, render dashboard with this QR code for editing
        res.render("dashboard", {
          qrCode: qrCode, // Pass the specific QR code in an array for consistent handling
          message: "Edit your QR code.",
          activeSection: "generate", // Set active section to 'update' for specific UI handling
        });
      }
    } else {
      // QR codes found for the user
      res.render("dashboard", {
        message: "Welcome! Here are your QR codes.",
        activeSection: "generate",
        qrCode: null,
      });
    }
  } catch (error) {
    console.error("Error fetching QR code data:", error);
    res.status(500).render("dashboard", {
      message: "An error occurred while fetching your QR codes.",
      type: "error", // Send type as 'error' to trigger toast notification
    });
  }
});

// Home route
router.get("/myqr", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId; // Assuming the auth middleware adds the user object to the request
    // Fetch QR code data for the logged-in user
    const qrCodes = await QRCodeData.find({ user_id: userId }).sort({
      createdAt: -1,
    });
    if (qrCodes.length > 0) {
      // QR codes found for the user
      res.render("dashboard", {
        qrCodes, // Pass the QR codes to the template
        message: "Welcome! Here are your QR codes.",
        activeSection: "show",
      });
    } else {
      // No QR codes found for the user
      res.render("dashboard", {
        qrCodes: [], // Pass an empty array for QR codes
        message: "No QR codes found.",
        activeSection: "show",
      });
    }
  } catch (error) {
    console.error("Error fetching QR code data:", error);
    res.status(500).render("dashboard", {
      qrCodes: [],
      message: "An error occurred while fetching your QR codes.",
      type: "error", // Send type as 'error' to trigger toast notification
    });
  }
});

router.post(
  "/generate",
  authMiddleware,
  upload.fields([
    { name: "media-file", maxCount: 1 },
    { name: "text-file", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  multerErrorHandler,
  async (req, res) => {
    const {
      qrName,
      type,
      qrDotColor,
      backgroundColor,
      dotStyle,
      cornerStyle,
      applyGradient,
      code,
      url,
      text,
    } = req.body; // Extract new values from request body
    const user_id = req.user.userId;
    // const url = req.body.url || "";
    // const text = req.body.text || "";

    // Handle media and text file uploads
    let mediaFilePath;
    let logoPath;

    try {
      if (!qrName) {
        return res
          .status(400)
          .json({ message: "Please enter QR name", type: "error" });
      }
      if (!code) {
        return res.status(500).json({
          message:
            "An unexpected error occurred. Please try again in a few moments.",
          type: "error",
        });
      }

      if (type === "media") {
        // Check if media file is attached
        if (!req.files["media-file"]) {
          return res
            .status(400)
            .json({ message: "Media file not attached", type: "error" });
        }
        // Assuming req.files["media-file"] is correctly populated by your upload middleware
        const mediaFile = req.files["media-file"][0];

        // Validate media file size
        if (mediaFile.size > MAX_FILE_SIZE) {
          return res.status(400).json({
            message: "Media file size should not exceed 50 MB",
            type: "error",
          });
        }
        mediaFilePath = mediaFile.path; // Path to uploaded media file
      } else if (type === "text") {
        // Check if text file is attached
        if (!text) {
          return res
            .status(400)
            .json({ message: "Text is missing", type: "error" });
        }
      } else if (type === "url") {
        // Validate URL

        if (!url) {
          return res
            .status(400)
            .json({ message: "Url is missing", type: "error" });
        }
        // Ensure the URL starts with 'http://' or 'https://'
        if (!/^https?:\/\//i.test(url)) {
          return res.status(400).json({
            message: "URL must begin with 'http://' or 'https://'.",
            type: "error",
          });
        }
      } else {
        return res.status(400).json({ message: "Invalid type", type: "error" });
      }

      // Check if logo file exists and save it if provided
      if (req.files["logo"]) {
        const logoFile = req.files["logo"][0];
        const logoFolderPath = path.join(__dirname, "../logos");

        // Ensure the logos folder exists
        if (!fs.existsSync(logoFolderPath)) {
          fs.mkdirSync(logoFolderPath);
        }

        // Set the logo path to save in database
        logoPath = path.join("logos", logoFile.filename);
        const logoFullPath = path.join(logoFolderPath, logoFile.filename);

        // Move the uploaded logo to the 'logos' folder
        fs.renameSync(logoFile.path, logoFullPath);
      }

      const qrCode = new QRCodeData({
        user_id,
        type,
        url,
        text,
        code, // Add the generated code here
        qrName,
        qrDotColor,
        backgroundColor,
        dotStyle,
        cornerStyle,
        applyGradient,
        logo: logoPath, // Save logo path if provided
      });
      // Save additional media or text file paths if applicable
      if (type === "media") {
        qrCode.media_url = mediaFilePath; // Save media file path
      }
      // else if (type === "text") {
      //   qrCode.text_url = textFilePath; // Save text file path
      // }

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
          code, // Return the generated code in the response
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error generating QR code." });
    }
  }
);

// Logout route
router.post("/logout", (req, res) => {
  try {
    // Clear the token and userId cookies
    res.clearCookie("token", { httpOnly: false });
    res.clearCookie("userId", { httpOnly: false });

    // Send a response indicating successful logout
    res.status(200).json({ message: "Logout successful", type: "success" });
  } catch (error) {
    console.error("Error during logout:", error);
    res
      .status(500)
      .json({ message: "An error occurred during logout", type: "error" });
  }
});

router.delete("/delete/:id", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params; // Record ID from the request parameters

  try {
    // Find and delete the QR code record that matches both user_id and qr_id
    const qrCode = await QRCodeData.findOneAndDelete({
      _id: id,
      user_id: userId,
    });

    // Check if the QR code record was found and deleted
    if (!qrCode) {
      return res.status(404).json({
        message: "QR Code not found or you are not authorized to delete it",
        type: "error",
      });
    }

    // Store the file paths for media and text files
    const existingMediaUrl = qrCode.media_url;
    const existingLogoUrl = qrCode.logo;

    // Delete the associated media file if it exists
    if (existingMediaUrl) {
      const mediaFilePath = path.resolve(__dirname, "..", existingMediaUrl);
      console.log(mediaFilePath, "new here");
      console.log(`Attempting to delete media file at: ${mediaFilePath}`);
      fs.unlink(mediaFilePath, (err) => {
        if (err) {
          console.error("Error deleting media file:", err);
        } else {
          console.log("Media file deleted successfully.");
        }
      });
    }

    // Delete the associated logo file if it exists
    if (existingLogoUrl) {
      const logoFilePath = path.resolve(__dirname, "..", existingLogoUrl);
      fs.unlink(logoFilePath, (err) => {
        if (err) {
          console.error("Error deleting logo file:", err);
        } else {
          console.log("Logo file deleted successfully.");
        }
      });
    }

    // Render success message after successful deletion
    res.status(200).json({
      message: "QR Code and associated files deleted successfully!",
      type: "success",
    });
  } catch (error) {
    console.error("Error during deletion:", error);
    res.status(500).json({
      message: "An error occurred during deletion",
      type: "error",
    });
  }
});

router.put(
  "/update/:id", // Update QR code by ID
  authMiddleware,
  upload.fields([
    { name: "media-file", maxCount: 1 },
    { name: "text-file", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  multerErrorHandler,
  async (req, res) => {
    const {
      type,
      url: newUrl,
      text,
      qrName,
      qrDotColor,
      backgroundColor,
      dotStyle,
      cornerStyle,
      applyGradient,
    } = req.body; // Get type and URL from request body
    const qrCodeAlphanumeric = req.params.id;
    const user_id = req.user.userId;

    try {
      // Fetch the existing QR code by ID
      const qrCode = await QRCodeData.findOne({
        code: qrCodeAlphanumeric,
        user_id,
      });

      // Store existing file paths for deletion later if necessary
      const existingMediaUrl = qrCode.media_url;
      const existingLogoUrl = qrCode.logo;

      if (!qrCode) {
        return res
          .status(404)
          .json({ message: "QR Code not found", type: "error" });
      }

      // Ensure the user is authorized to update the QR code
      if (qrCode.user_id.toString() !== user_id) {
        return res
          .status(403)
          .json({ message: "Unauthorized access", type: "error" });
      }

      // Handle updates based on the type
      if (type === "url") {
        if (!newUrl) {
          return res
            .status(400)
            .json({ message: "Url is missing", type: "error" });
        }

        // Ensure the URL starts with 'http://' or 'https://'
        if (!/^https?:\/\//i.test(newUrl)) {
          return res.status(400).json({
            message: "URL must begin with 'http://' or 'https://'.",
            type: "error",
          });
        }
        qrCode.url = newUrl; // Update the URL in the database

        // Clear media_url and text_url if type is url
        qrCode.media_url = null;
        qrCode.text_url = null;
      } else if (type === "text") {
        if (!text) {
          return res
            .status(400)
            .json({ message: "Text is missing", type: "error" });
        }
        // qrCode.text_url = req.files["text-file"][0].path; // Update text file path

        // Clear media_url if type is text
        qrCode.media_url = null;
        qrCode.url = null;
      } else if (type === "media") {
        if (!req.files["media-file"]) {
          return res
            .status(400)
            .json({ message: "Media file not attached", type: "error" });
        }

        // Assuming req.files["media-file"] is correctly populated by your upload middleware
        const mediaFile = req.files["media-file"][0];

        // Validate media file size
        if (mediaFile.size > MAX_FILE_SIZE) {
          return res.status(400).json({
            message: "Media file size should not exceed 50 MB",
            type: "error",
          });
        }
        qrCode.media_url = mediaFile.path; // Update media file path

        // Clear text_url if type is media
        qrCode.text_url = null;
        qrCode.url = null;
      } else {
        return res.status(400).json({ message: "Invalid type", type: "error" });
      }

      // Remove existing files if they were previously uploaded
      if (existingMediaUrl) {
        const existingMediaPath = path.resolve(
          __dirname,
          "..",
          existingMediaUrl
        ); // Resolve the path
        console.log(`Attempting to delete media file at: ${existingMediaPath}`); // Log the path
        fs.unlink(existingMediaPath, (err) => {
          if (err) {
            console.error("Error deleting existing media file:", err);
          } else {
            console.log("Successfully deleted media file.");
          }
        });
      }

      // Delete existing logo file if applicable
      if (existingLogoUrl) {
        const existingLogoPath = path.resolve(__dirname, "..", existingLogoUrl);
        fs.unlink(existingLogoPath, (err) => {
          if (err) {
            console.error("Error deleting existing logo file:", err);
          } else {
            console.log("Successfully deleted logo file.");
          }
        });
      }
      // Move new logo to 'logos' folder if a new logo file is provided
      if (req.files["logo"]) {
        const newLogoPath = path.join("logos", req.files["logo"][0].filename);
        const logoTempPath = req.files["logo"][0].path;
        qrCode.logo = newLogoPath;

        // Move logo to the 'logos' directory
        fs.rename(logoTempPath, newLogoPath, (err) => {
          if (err) {
            console.error("Error moving logo file to 'logos' folder:", err);
            return res.status(500).json({ message: "Error saving new logo." });
          } else {
            qrCode.logo = newLogoPath; // Update the logo path in the QR code data
            console.log("Logo file successfully moved to 'logos' folder.");
          }
        });
      } else {
        // Set logo to null if no new logo file is provided
        qrCode.logo = null;
      }
      qrCode.type = type; // Change the type
      // Assign new fields to the qrCode object
      qrCode.qrName = qrName; // Assign qrName
      qrCode.qrDotColor = qrDotColor; // Assign qrDotColor
      qrCode.backgroundColor = backgroundColor; // Assign backgroundColor
      qrCode.dotStyle = dotStyle; // Assign dotStyle
      qrCode.cornerStyle = cornerStyle; // Assign cornerStyle
      qrCode.applyGradient = applyGradient; // Assign applyGradient
      qrCode.text = text;

      // Save the updated QR code data (keep the same QR image)
      await qrCode.save();

      // Send a response back to the client
      res.status(200).json({
        message: "QR Code updated successfully.",
        qrCode: {
          id: qrCode._id,
          user_id,
          type: qrCode.type, // The updated or existing type
          url: qrCode.url, // The updated or existing URL
          qr_image: qrCode.qr_image, // Keep the existing QR image (no change)
          code: qrCode.code, // The updated alphanumeric code
          qrName: qrCode.qrName, // Include the updated qrName
          qrDotColor: qrCode.qrDotColor, // Include updated qrDotColor
          backgroundColor: qrCode.backgroundColor, // Include updated backgroundColor
          dotStyle: qrCode.dotStyle, // Include updated dotStyle
          cornerStyle: qrCode.cornerStyle, // Include updated cornerStyle
          applyGradient: qrCode.applyGradient, // Include updated applyGradient
          logo: qrCode.logo, // Include updated logo path
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error updating QR code." });
    }
  }
);

// Route to handle alphanumeric codes
router.get("/:alphanumericCode([a-zA-Z0-9]{6})", async (req, res) => {
  try {
    const { alphanumericCode } = req.params; // Get alphanumericCode from the URL

    // Find the record using the alphanumeric code
    const codeData = await QRCodeData.findOne({ code: alphanumericCode });

    if (!codeData) {
      // If no data found for the alphanumeric code
      return res.status(404).render("error", {
        message: "Code not found.",
        type: "error", // Used for toast or error notification
      });
    }

    // Check the type of the code and handle accordingly
    if (codeData.type === "url") {
      // Redirect to the URL found in the database if type is 'url'
      return res.redirect(codeData.url); // Redirects to the URL
    } else if (codeData.type === "media") {
      // Redirect to the media URL if type is 'media'
      return res.redirect(
        `${req.protocol}://${req.get("host")}/${codeData.media_url}`
      ); // Assuming media_url is a relative path (e.g., uploads/)
    } else if (codeData.type === "text") {
      // Send plain HTML response to display the text content
      return res.send(`
        <html>
          <head>
            <title>Text Display</title>
          </head>
          <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f9; display: flex; justify-content: center; align-items: center; height: 100vh;">
            <div style="max-width: 600px; text-align: center; padding: 20px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); font-size: 30px; line-height: 1.6; color: #333;">
              ${codeData.text}
            </div>
          </body>
        </html>
      `);
    } else {
      // If the type is not valid, return an error
      return res.status(400).render("error", {
        message: "Invalid type associated with this code.",
        type: "error",
      });
    }
  } catch (error) {
    console.error("Error fetching code data:", error);
    return res.status(500).render("error", {
      message: "An error occurred while processing the code.",
      type: "error",
    });
  }
});

// Home route
router.get("/newqr", async (req, res) => {
  try {
    res.render("qr"); // Send type as 'success'
  } catch (error) {
    console.error("Error generating QR code:", error);
    res.status(500).render("index", {
      message: "Failed to generate QR code",
      type: "error", // Send type as 'error'
    });
  }
});

module.exports = router;
