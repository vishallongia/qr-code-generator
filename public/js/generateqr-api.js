const qrDataType = document.getElementById("qr-type");
const submitBtn = document.querySelector(".submit-btn"); // Get the submit button

submitBtn.addEventListener("click", async (event) => {
  event.preventDefault(); // Prevent the default form submission

  const formData = new FormData(); // Create a FormData object
  const type = qrDataType.value; // Get the selected type

  // Append user ID and type to the FormData object
  formData.append("type", type);

  // Append the input file or URL based on the selected QR type
  if (type === "media") {
    const mediaFileInput = document.getElementById("media-file");
    if (mediaFileInput.files.length > 0) {
      formData.append("media-file", mediaFileInput.files[0]); // Append the media file
    } else {
      showToast("Please attach a media file.", "error");
      return; // Stop further processing if file is not attached
    }
  } else if (type === "text") {
    const textFileInput = document.getElementById("text-file");
    if (textFileInput.files.length > 0) {
      formData.append("text-file", textFileInput.files[0]); // Append the text file
    } else {
      showToast("Please attach a text file.", "error");
      return;
    }
  } else if (type === "url") {
    const urlInput = document.getElementById("url");
    if (urlInput.value) {
      formData.append("url", urlInput.value); // Append the URL
    } else {
      showToast("Please provide a URL.", "error");
      return;
    }
  }

  try {
    const result = await generateQRCode(formData); // Call the function to generate the QR code
    // form.reset(); // Reset the form after successful submission
    showToast(result.message, "success"); // Show success message
    window.location.reload();
  } catch (error) {
    showToast(error.message || "Error generating QR code.", "error"); // Show error message
  }
});

// Function to generate the QR code
async function generateQRCode(formData) {
  try {
    const response = await fetch("/generate", {
      method: "POST",
      body: formData, // FormData auto-sets Content-Type to multipart/form-data
    });

    const result = await response.json();
    console.log(result, "QR code generated successfully!");

    if (!response.ok) {
      throw new Error(result.message || "QR Code generation failed!");
    }

    return result; // Return the result for further handling
  } catch (error) {
    console.error("Error:", error);
    throw error; // Propagate the error
  }
}
