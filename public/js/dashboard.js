const menuToggle = document.querySelector(".menu-toggle");
const menuClose = document.querySelector(".menu-close");
const sideMenu = document.querySelector(".side-menu");
const menuItems = document.querySelectorAll(".menu-item");
const generateSection = document.getElementById("generate-section");
const showSection = document.getElementById("show-section");
const qrType = document.getElementById("qr-type");
const inputFields = document.getElementById("input-fields");

menuToggle.addEventListener("click", () => {
  sideMenu.classList.add("active");
});

menuClose.addEventListener("click", () => {
  sideMenu.classList.remove("active");
});

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    menuItems.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
    if (item.dataset.section === "generate") {
      generateSection.style.display = "block";
      showSection.style.display = "none";
    } else {
      generateSection.style.display = "none";
      showSection.style.display = "block";
    }
    if (window.innerWidth <= 768) {
      sideMenu.classList.remove("active");
    }
  });
});

qrType.addEventListener("change", updateInputFields);

function updateInputFields() {
  inputFields.innerHTML = "";
  let input;

  switch (qrType.value) {
    case "media":
      input = createInput("file", "media-file", "Select Media File");
      break;
    case "text":
      input = createInput("file", "text-file", "Select Text File");
      break;
    case "url":
      input = createInput("text", "url", "Enter URL");
      break;
  }

  inputFields.appendChild(input);
  inputFields.classList.add("fade-in");
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

//Frontend Qr Genration

function generateAlphanumericCode(length = 6) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

const qrCode = new QRCodeStyling({
  width: 200,
  height: 200,
  type: "canvas",
  data: "https://example.com",
  dotsOptions: {
    color: "#000000",
    type: "square",
  },
  backgroundOptions: {
    color: "#ffffff",
  },
  cornersSquareOptions: {
    type: "square",
  },
});

qrCode.append(document.getElementById("qr-code"));

function generateQRCodeFe() {
  const alphanumericCode = generateAlphanumericCode();

  // Generate the QR text URL dynamically
  const qrUrl = `${window.location.protocol}//${window.location.host}/${alphanumericCode}`;
  document.getElementById("qr-text").value = `${qrUrl}`;

  document.getElementById("qr-code-key").value = alphanumericCode;
  const qrColor = document.getElementById("qr-color").value;
  const bgColor = document.getElementById("bg-color").value;
  const dotStyle = document.getElementById("dot-style").value;
  const cornerStyle = document.getElementById("corner-style").value;
  const gradient = document.getElementById("gradient").value;
  const logoFile = document.getElementById("logo").files[0];

  // Gradient settings
  let dotColor = { color: qrColor };
  if (gradient === "linear") {
    dotColor = {
      gradient: {
        type: "linear",
        colorStops: [
          { offset: 0, color: "#ff0000" },
          { offset: 1, color: qrColor },
        ],
      },
    };
  } else if (gradient === "radial") {
    dotColor = {
      gradient: {
        type: "radial",
        colorStops: [
          { offset: 0, color: "#ff0000" },
          { offset: 1, color: qrColor },
        ],
      },
    };
  }

  // Load the image for logo if uploaded
  let logoUrl = "";
  if (logoFile) {
    const reader = new FileReader();
    reader.onload = function (event) {
      logoUrl = event.target.result;
      updateQRCodeFe(qrText, dotColor, bgColor, dotStyle, cornerStyle, logoUrl);
    };
    reader.readAsDataURL(logoFile);
  } else {
    updateQRCodeFe(qrText, dotColor, bgColor, dotStyle, cornerStyle, logoUrl);
  }
}

function updateQRCodeFe(
  qrText,
  dotColor,
  bgColor,
  dotStyle,
  cornerStyle,
  logoUrl
) {
  qrCode.update({
    data: qrText,
    dotsOptions: {
      color: dotColor.color,
      type: dotStyle,
      gradient: dotColor.gradient,
    },
    backgroundOptions: {
      color: bgColor,
    },
    cornersSquareOptions: {
      type: cornerStyle,
    },
    image: logoUrl ? logoUrl : "", // Use logo image if provided
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 10,
    },
  });
}

function downloadQRCode() {
  qrCode.download({ name: "qr-code", extension: "png" });
}
