function validateLogin(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // Load users from localStorage if available
  const savedUsers = localStorage.getItem("udhaarUsers");
  if (savedUsers) {
    users = JSON.parse(savedUsers);
  }

  console.log("Available users:", users);
  
  const user = users.find((u) => u.email === email && u.password === password);
  console.log("Found user:", user);

  if (user) {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", user.role);
    localStorage.setItem("userId", user.id);
    window.location.href = "dashboard.html";
  } else {
    alert("Invalid credentials. Please try again.");
  }
}
