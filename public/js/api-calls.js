// api-calls.js

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
