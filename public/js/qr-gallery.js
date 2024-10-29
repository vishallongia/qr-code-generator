const modal = document.getElementById("qrModal");
const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
// const generateSection = document.getElementById("generate-section");
const qrTypeUpdate = document.getElementById("qr-type-update");
const inputFieldsUpdate = document.getElementById("input-fields-update");
const updateSection = document.getElementById("update-section");
const viewQr = document.getElementById("view-qr");
const submitBtnUpdate = document.getElementById("submit-btn-update");
let qrCodeIdToUpdate; // Declare a variable to store the QR Code ID
function openModal(qrImage, qrCode) {
  // Set the image and title
  modalImage.src = qrImage;
  modalTitle.innerText = qrCode;

  // Show the modal
  modal.style.display = "block";
  viewQr.style.display = "block";

  // Hide the generate section by default
  updateSection.style.display = "none";
}

// Function to toggle generate-section inside modal
function showGenerateSection(qr) {
  modal.style.display = "block";
  updateSection.style.display = "block";
  viewQr.style.display = "none";
  qrCodeIdToUpdate = qr._id;
  document.getElementById("qr-name-update").value = qr.qrName;
  document.getElementById("bg-color-update").value = qr.backgroundColor;
  document.getElementById("dot-style-update").value = qr.dotStyle;
  document.getElementById("corner-style-update").value = qr.cornerStyle;
  document.getElementById("gradient-update").value = qr.applyGradient;
  document.getElementById("qr-dot-color-update").value = qr.qrDotColor;
}

// Function to close the modal
function closeModal() {
  const modal = document.getElementById("qrModal");
  modal.style.display = "none";
}
qrTypeUpdate.addEventListener("change", updateInputFields);

function updateInputFields() {
  inputFieldsUpdate.innerHTML = "";
  let input;

  switch (qrTypeUpdate.value) {
    case "media":
      input = createInput("file", "media-file-update", "Select Media File");
      break;
    case "text":
      input = createInput("file", "text-file-update", "Select Text File");
      break;
    case "url":
      input = createInput("text", "url-update", "Enter URL");
      break;
  }

  inputFieldsUpdate.appendChild(input);
  inputFieldsUpdate.classList.add("fade-in");
}

function createInput(type, id, labelText) {
  const div = document.createElement("div");
  div.className = "input-group";

  const label = document.createElement("label");
  label.htmlFor = id;
  label.textContent = labelText;

  const input = document.createElement("input");
  input.type = type;
  input.id = id;

  div.appendChild(label);
  div.appendChild(input);

  return div;
}

updateInputFields();

// Handle form submission
submitBtnUpdate.addEventListener("click", async (event) => {
  event.preventDefault(); // Prevent default form submission
  const qrName = document.getElementById("qr-name-update").value;
  const backgroundColor = document.getElementById("bg-color-update").value;
  const dotStyle = document.getElementById("dot-style-update").value;
  const cornerStyle = document.getElementById("corner-style-update").value;
  const applyGradient = document.getElementById("gradient-update").value;
  const qrDotColor = document.getElementById("qr-dot-color-update").value;

  const formData = new FormData(); // Create a FormData object
  const type = qrTypeUpdate.value; // Get the selected type

  // Append type and other form data
  formData.append("type", type);
  formData.append("qrName", qrName);
  formData.append("backgroundColor", backgroundColor);
  formData.append("dotStyle", dotStyle);
  formData.append("cornerStyle", cornerStyle);
  formData.append("applyGradient", applyGradient);
  formData.append("qrDotColor", qrDotColor);

  if (type === "media") {
    const mediaFileInput = document.getElementById("media-file-update");
    if (mediaFileInput.files.length > 0) {
      formData.append("media-file", mediaFileInput.files[0]);
    } else {
      showToast("Please attach a media file.", "error");
      return;
    }
  } else if (type === "text") {
    const textFileInput = document.getElementById("text-file-update");
    if (textFileInput.files.length > 0) {
      formData.append("text-file", textFileInput.files[0]);
    } else {
      showToast("Please attach a text file.", "error");
      return;
    }
  } else if (type === "url") {
    const urlInput = document.getElementById("url-update");
    if (urlInput.value) {
      formData.append("url", urlInput.value);
    } else {
      showToast("Please provide a URL.", "error");
      return;
    }
  }

  try {
    // Get the QR Code ID dynamically (you may need to replace `qrCodeId` with the actual value)
    const qrCodeId = qrCodeIdToUpdate; // Replace with actual QR code ID

    // Send a PUT request to update the QR code
    const response = await fetch(`/update/${qrCodeId}`, {
      method: "PUT",
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Error updating QR code.");
    }

    showToast(result.message, "success");
    window.location.reload();
  } catch (error) {
    showToast(error.message || "Error updating QR code.", "error");
  }
});

function downloadQRCode(imageUrl) {
  const a = document.createElement("a"); // Create an anchor element
  a.href = imageUrl; // Set the URL of the image
  a.download = ""; // Use an empty string to download the image with its original name

  // Append the anchor to the document body
  document.body.appendChild(a);
  a.click(); // Trigger the click event to start the download
  document.body.removeChild(a); // Remove the anchor from the document
}
