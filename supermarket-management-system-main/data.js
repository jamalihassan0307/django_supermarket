// Initialize arrays
let products = [];
let orders = [];
let users = [
  {
    id: 1,
    email: "admin@gmail.com",
    password: "admin",
    role: "admin",
    name: "Admin User",
    udhaar: 0,
    dueDate: null
  },
  {
    id: 2,
    email: "user@gmail.com",
    password: "user",
    role: "user",
    name: "Regular User",
    udhaar: 0,
    dueDate: null
  }
];

// Function to generate new product ID
function generateProductId() {
  return products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
}

// Add IDs to products
products = products.map((product, index) => ({
  ...product,
  id: index + 1,
}));

// Initialize data from localStorage if available
function initializeData() {
  const savedUsers = localStorage.getItem("udhaarUsers");
  if (savedUsers) {
    users = JSON.parse(savedUsers);
  } else {
    // Save initial users to localStorage
    saveData();
  }
}

// Call initializeData when the script loads
initializeData();
