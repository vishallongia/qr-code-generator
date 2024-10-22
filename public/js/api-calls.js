// api-calls.js
// Attach logout functionality to the logout button
document.querySelector(".logout-btn").addEventListener("click", handleLogout);

// Function to register a user
async function registerUser(data) {
  try {
    const response = await fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data), // Send the form data as JSON
    });

    // Check if the response is OK
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Registration failed!");
    }

    // Return the response data
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error; // Propagate error for handling in the calling function
  }
}

// Function to log in a user and receive a JWT token
async function loginUser(data) {
  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data), // Send login data as JSON
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Login failed!");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Propagate error for handling in the calling function
  }
}

// Handle the form submission
async function handleRegister(event) {
  event.preventDefault(); // Prevent the default form submission

  const form = event.target; // Get the form element
  const formData = new FormData(form); // Use the FormData API
  const data = Object.fromEntries(formData); // Convert FormData to an object

  // Call the registerUser function
  try {
    const result = await registerUser(data); // Call the API function
    showToast(result.message, "success"); // Show success message
    form.reset(); // Reset the form after successful submission
  } catch (error) {
    showToast(error.message || "An error occurred. Please try again.", "error"); // Show error message
  }
}

// Handle login form submission
async function handleLogin(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  try {
    const result = await loginUser(data); // Call the login API
    form.reset(); // Reset the form after successful login
    window.location.href = "/dashboard";
    showToast(result.message, "success");
  } catch (error) {
    showToast(error.message || "An error occurred. Please try again.", "error");
  }
}

// Function to log out a user
async function logoutUser() {
  try {
    const response = await fetch("/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Logout failed!");
    }

    return await response.json();
  } catch (error) {
    console.error("Error during logout:", error);
    throw error; // Propagate error for handling in the calling function
  }
}

// Handle logout button click
async function handleLogout(event) {
  event.preventDefault(); // Prevent default button action

  try {
    const result = await logoutUser(); // Call the logout API
    showToast(result.message, "success"); // Show success message

    // Redirect to login page after successful logout
    setTimeout(() => {
      window.location.href = "/";
    }, 1000); // Optional delay to let the toast show up
  } catch (error) {
    showToast(error.message || "An error occurred. Please try again.", "error");
  }
}

// Function to delete a QR code
async function deleteQRCode(id) {
  try {
    const response = await fetch(`/delete/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Deletion failed!");
    }

    return await response.json();
  } catch (error) {
    console.error("Error during deletion:", error);
    throw error; // Propagate error for handling in the calling function
  }
}

// Function to delete a QR code
async function deleteQRCode(id) {
  if (!confirm("Are you sure you want to delete this QR code?")) {
    return; // Exit if user cancels the deletion
  }

  try {
    const response = await fetch(`/delete/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Deletion failed!");
    }

    const result = await response.json();
    alert(result.message); // Show success message
    window.location.reload();
  } catch (error) {
    console.error("Error during deletion:", error);
    alert(error.message || "An error occurred. Please try again.");
  }
}
