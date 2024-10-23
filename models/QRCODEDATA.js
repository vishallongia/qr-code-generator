const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User schema
      required: true,
    },
    type: {
      type: String,
      enum: ["media", "text", "url"], // Types of QR codes
      required: true,
    },
    url: {
      type: String,
      // required: true, // The URL of the uploaded file or provided URL
    },
    qr_image: {
      type: String,
      required: true, // Path to the generated QR code image
    },
    media_url: {
      type: String, // URL to the media file if applicable
    },
    text_url: {
      type: String, // URL to the text file if applicable
    },
    code: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const QRCodeData = mongoose.model("QRCodeData", qrCodeSchema);
module.exports = QRCodeData;
