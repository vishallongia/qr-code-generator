function openModal(qrImage, qrCode) {
  const modal = document.getElementById("qrModal");
  const modalImage = document.getElementById("modalImage");
  const modalTitle = document.getElementById("modalTitle");
  const generateSection = document.getElementById("generate-section");

  // Set the image and title
  modalImage.src = qrImage;
  modalTitle.innerText = qrCode;

  // Show the modal
  modal.style.display = "block";

  // Hide the generate section by default
  generateSection.style.display = "none";
}

// Function to toggle generate-section inside modal
function showGenerateSection() {
  const generateSection = document.getElementById("generate-section");
  const modal = document.getElementById("qrModal");
  generateSection.style.display = "block"; // Show the generate section
  modal.style.display = "block";
}

// Function to close the modal
function closeModal() {
  const modal = document.getElementById("qrModal");
  modal.style.display = "none";
}
