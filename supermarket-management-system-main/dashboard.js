if (!localStorage.getItem("isLoggedIn")) {
  window.location.href = "login.html";
}

function logout() {
  localStorage.removeItem("isLoggedIn");
  window.location.href = "index.html";
}

function showSection(sectionId) {
  const userRole = localStorage.getItem("userRole");
  
  // Hide all sections first
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.add("hidden");
  });
  
  // Remove active class from all buttons
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  
  // Show the selected section
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.remove("hidden");
  }
  
  // Add active class to the clicked button
  const activeButton = document.querySelector(`.nav-btn[onclick="showSection('${sectionId}')"]`);
  if (activeButton) {
    activeButton.classList.add("active");
  }
  
  // Update the UI based on user role
  updateUIForUserRole(userRole);
  
  refreshData(sectionId);
}

function updateUIForUserRole(userRole) {
  const adminOnlyButtons = document.querySelectorAll('.admin-only');
  const userOnlyButtons = document.querySelectorAll('.user-only');
  const adminOnlySections = document.querySelectorAll('.admin-only-section');
  const userOnlySections = document.querySelectorAll('.user-only-section');
  
  if (userRole === 'admin') {
    adminOnlyButtons.forEach(button => button.style.display = 'block');
    userOnlyButtons.forEach(button => button.style.display = 'none');
    adminOnlySections.forEach(section => section.style.display = 'block');
    userOnlySections.forEach(section => section.style.display = 'none');
  } else {
    adminOnlyButtons.forEach(button => button.style.display = 'none');
    userOnlyButtons.forEach(button => button.style.display = 'block');
    adminOnlySections.forEach(section => section.style.display = 'none');
    userOnlySections.forEach(section => section.style.display = 'block');
  }
}

function refreshData(sectionId) {
  updateDashboardStats();

  switch (sectionId) {
    case "products":
      displayProducts();
      break;
    case "orders":
      displayOrders();
      break;
    case "users":
      displayUsers();
      break;
  }
}

async function displayProducts() {
  try {
    products = await getProducts();

    saveData();

    const productsList = document.getElementById("productsList");
    let html = `
          <table>
              <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
              </tr>
      `;

    products.forEach((product) => {
      html += `
              <tr>
                  <td>${product.name}</td>
                  <td>PKR - ${product.price}</td>
                  <td>${product.stock}</td>
                  <td>
                      <button onclick="editProduct(${product.id})" class="action-btn">Edit</button>
                      <button onclick="updateStock(${product.id})" class="action-btn">Update Stock</button>
                  </td>
              </tr>
          `;
    });

    html += "</table>";
    productsList.innerHTML = html;
  } catch (error) {
    console.error("Error loading products:", error);
    alert("Error loading products. Using local data.");
    products = JSON.parse(localStorage.getItem("udhaarProducts")) || [];
    displayProductsList();
  }
}

let currentProductId = null;

function showModal() {
  document.getElementById("productModal").classList.add("show");
}

function hideModal() {
  document.getElementById("productModal").classList.remove("show");

  document.getElementById("productForm").reset();
  currentProductId = null;
}

function showAddProductForm() {
  document.getElementById("modalTitle").textContent = "Add New Product";
  document.getElementById("productForm").onsubmit = handleAddProduct;
  showModal();
}

async function handleAddProduct(event) {
  event.preventDefault();

  const newProduct = {
    id: generateProductId(),
    name: document.getElementById("productName").value,
    price: parseFloat(document.getElementById("productPrice").value),
    stock: parseInt(document.getElementById("productStock").value),
  };

  try {
    products.push(newProduct);
    saveData();
    displayProducts();
    hideModal();
    alert("Product added successfully!");
  } catch (error) {
    console.error("Error adding product:", error);
    alert("Error adding product. Please try again.");
  }
}

function editProduct(productId) {
  console.log("Edit button clicked for product ID:", productId);
  const product = products.find((p) => p.id === productId);
  if (!product) {
    alert("Product not found!");
    return;
  }

  const newName = prompt("Enter new name:", product.name);
  if (newName === null) return;

  const newPrice = prompt("Enter new price:", product.price);
  if (newPrice === null) return;

  const newStock = prompt("Enter new stock:", product.stock);
  if (newStock === null) return;

  // Update product
  product.name = newName || product.name;
  product.price = parseFloat(newPrice) || product.price;
  product.stock = parseInt(newStock) || product.stock;

  // Save changes
  saveData();
  displayProducts();
  alert("Product updated successfully!");
}

function updateStock(productId) {
  console.log("Update Stock button clicked for product ID:", productId);
  const product = products.find((p) => p.id === productId);
  if (!product) {
    alert("Product not found!");
    return;
  }

  const newStock = prompt("Enter new stock quantity:", product.stock);
  if (newStock === null) return;

  const stockNum = parseInt(newStock);
  if (isNaN(stockNum) || stockNum < 0) {
    alert("Please enter a valid stock quantity!");
    return;
  }

  // Update stock
  product.stock = stockNum;
  saveData();
  displayProducts();
  alert("Stock updated successfully!");
}

async function displayOrders() {
  try {
    orders = await getOrders();
    saveData();

    const ordersList = document.getElementById("ordersList");
    let html = `
          <table>
              <tr>
                  <th>Order ID</th>
                  <th>User</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
              </tr>
      `;

    orders.forEach((order) => {
      const user = users.find((u) => u.id === order.userId);
      html += `
              <tr>
                  <td>${order.id}</td>
                  <td>${user ? user.name : "Unknown User"}</td>
                  <td>PKR - ${order.totalAmount}</td>
                  <td>${order.status}</td>
                  <td>${order.date}</td>
                  <td>
                      <button onclick="viewOrderDetails(${
                        order.id
                      })" class="action-btn">View Details</button>
                  </td>
              </tr>
          `;
    });

    html += "</table>";
    ordersList.innerHTML = html;
  } catch (error) {
    console.error("Error loading orders:", error);
    alert("Error loading orders. Using local data.");
    orders = JSON.parse(localStorage.getItem("udhaarOrders")) || [];
    displayOrdersList();
  }
}

function displayUsers() {
  const usersList = document.getElementById("usersList");
  let html = `
        <table>
            <tr>
                <th>Name</th>
                <th>Udhaar Amount</th>
                <th>Due Date</th>
                <th>Actions</th>
            </tr>
    `;

  const usersWithUdhaar = users.filter((user) => user.udhaar > 0);

  usersWithUdhaar.forEach((user) => {
    const isDueDate = user.dueDate && new Date(user.dueDate) < new Date();
    html += `
            <tr ${isDueDate ? 'class="overdue"' : ""}>
                <td>${user.name}</td>
                <td>PKR - ${user.udhaar}</td>
                <td>${user.dueDate || "No due date"}</td>
                <td>
                    <button onclick="editUser(${
                      user.id
                    })" class="action-btn">Edit</button>
                    <button onclick="viewUserDetails(${
                      user.id
                    })" class="action-btn">View Details</button>
                    <button onclick="markAsPaid(${
                      user.id
                    })" class="action-btn paid-btn">Mark as Paid</button>
                </td>
            </tr>
        `;
  });

  html += "</table>";
  usersList.innerHTML = html;
}

async function markAsPaid(userId) {
  const user = users.find((u) => u.id === userId);
  if (!user) return;

  try {
    const userOrders = orders.filter(
      (order) => order.userId === userId && order.status === "Unpaid"
    );

    for (const order of userOrders) {
      const updatedOrder = { ...order, status: "Paid" };
      await updateOrder(order.id, updatedOrder);
    }

    orders = orders.map((order) =>
      order.userId === userId && order.status === "Unpaid"
        ? { ...order, status: "Paid" }
        : order
    );

    user.udhaar = 0;
    user.dueDate = null;

    saveData();
    await displayOrders();
    displayUsers();
    updateDashboardStats();
    alert("All payments marked as paid for " + user.name);
  } catch (error) {
    console.error("Error marking orders as paid:", error);
    alert("Error updating payment status. Please try again.");
  }
}

function showNewOrderForm() {
  const userRole = localStorage.getItem("userRole");
  const userId = localStorage.getItem("userId");
  
  document.getElementById("orderModalTitle").textContent = "Create New Order";
  document.getElementById("orderForm").onsubmit = handleCreateOrder;

  const userSelect = document.getElementById("orderUser");
  userSelect.innerHTML = '<option value="">Select User</option>';

  if (userRole === 'admin') {
    // Admin can select any user
    users.forEach((user) => {
      userSelect.innerHTML += `<option value="${user.id}">${user.name}</option>`;
    });
    userSelect.disabled = false;
  } else {
    // Regular user - auto-select their account
    const currentUser = users.find(u => u.id === parseInt(userId));
    if (currentUser) {
      userSelect.innerHTML = `<option value="${currentUser.id}" selected>${currentUser.name}</option>`;
      userSelect.disabled = true;
    }
  }

  resetOrderProducts();
  document.getElementById("orderModal").classList.add("show");
}

function hideOrderModal() {
  document.getElementById("orderModal").classList.remove("show");
  document.getElementById("orderForm").reset();
  resetOrderProducts();
}

function resetOrderProducts() {
  const orderProducts = document.getElementById("orderProducts");
  orderProducts.innerHTML = "";
  addProductField();
}

function addProductField() {
  const orderProducts = document.getElementById("orderProducts");
  const productDiv = document.createElement("div");
  productDiv.className = "order-product input-group";

  let productOptions = '<option value="">Select Product</option>';
  products.forEach((product) => {
    if (product.stock > 0) {
      productOptions += `<option value="${product.id.toString()}">
        ${product.name} (Stock: ${product.stock})
      </option>`;
    }
  });

  productDiv.innerHTML = `
    <label>Select Product</label>
    <select class="product-select" required onchange="updateQuantityLimit(this)">
      ${productOptions}
    </select>
    <input 
      type="number" 
      class="quantity-input" 
      placeholder="Quantity" 
      min="1" 
      required 
      onchange="validateQuantity(this)"
    />
    <button type="button" class="cancel-btn" onclick="removeProductField(this)">Remove</button>
  `;

  orderProducts.appendChild(productDiv);
}

function removeProductField(button) {
  if (document.querySelectorAll(".order-product").length > 1) {
    button.parentElement.remove();
  }
}

async function handleCreateOrder(event) {
  event.preventDefault();

  try {
    const userRole = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    
    let selectedUserId;
    if (userRole === 'admin') {
      selectedUserId = parseInt(document.getElementById("orderUser").value);
      if (!selectedUserId) {
        throw new Error("Please select a user!");
      }
    } else {
      selectedUserId = parseInt(userId);
    }

    const status = document.getElementById("orderStatus").value;
    const productFields = document.querySelectorAll(".order-product");

    if (productFields.length === 0) {
      throw new Error("Please add at least one product!");
    }

    let totalAmount = 0;
    const productData = [];
    const stockUpdates = new Map();

    for (let field of productFields) {
      const productSelect = field.querySelector(".product-select");
      const quantityInput = field.querySelector(".quantity-input");

      const productId = productSelect.value;
      if (!productId) {
        throw new Error("Please select a product for all fields!");
      }

      const quantity = parseInt(quantityInput.value);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error("Please enter a valid quantity!");
      }

      const product = products.find(
        (p) => p.id.toString() === productId.toString()
      );
      if (!product) {
        throw new Error("Invalid product selection!");
      }

      if (
        productData.some(
          (item) => item.productId.toString() === productId.toString()
        )
      ) {
        throw new Error(
          `${product.name} is selected multiple times! Please combine quantities.`
        );
      }

      const currentTotal = stockUpdates.get(productId) || 0;
      const newTotal = currentTotal + quantity;

      if (newTotal > product.stock) {
        throw new Error(
          `Not enough stock for ${product.name}! Available: ${product.stock}`
        );
      }

      stockUpdates.set(productId, newTotal);

      productData.push({
        productId: productId.toString(),
        quantity,
        price: product.price * quantity,
      });
      totalAmount += product.price * quantity;
    }

    const newOrder = {
      userId: selectedUserId,
      productData,
      totalAmount,
      status,
      date: new Date().toISOString().split("T")[0],
    };

    const createdOrder = await createOrder(newOrder);

    if (!createdOrder) {
      throw new Error("Failed to create order!");
    }

    stockUpdates.forEach((quantity, productId) => {
      const product = products.find(
        (p) => p.id.toString() === productId.toString()
      );
      if (product) {
        product.stock -= quantity;
      }
    });

    if (status === "Unpaid") {
      const user = users.find((u) => u.id === selectedUserId);
      if (user) {
        user.udhaar += totalAmount;
        user.dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      }
    }

    saveData();
    await displayOrders();
    hideOrderModal();
    alert("Order created successfully!");
  } catch (error) {
    console.error("Error creating order:", error);
    alert(error.message || "Error creating order. Please try again.");
    return false;
  }
}

function viewOrderDetails(orderId) {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;

  let details = "Order Details:\n\n";
  details += `Order ID: ${order.id}\n`;
  details += `Date: ${order.date}\n`;
  details += `Status: ${order.status}\n\n`;

  details += "Products:\n";
  order.productData.forEach((item) => {
    const product = products.find((p) => p.id === item.productId);
    details += `${product.name} x ${item.quantity} = PKR - ${item.price}\n`;
  });

  details += `\nTotal Amount: PKR - ${order.totalAmount}`;

  alert(details);
}

function showAddUserForm() {
  document.getElementById("userModalTitle").textContent = "Add New User";
  document.getElementById("userForm").onsubmit = handleAddUser;

  document.getElementById("userForm").reset();
  document.getElementById("userUdhaar").value = "0";

  showUserModal();
}

function showUserModal() {
  document.getElementById("userModal").classList.add("show");
}

function hideUserModal() {
  document.getElementById("userModal").classList.remove("show");
  document.getElementById("userForm").reset();
}

function handleAddUser(event) {
  event.preventDefault();

  const name = document.getElementById("userName").value;
  const udhaar = parseFloat(document.getElementById("userUdhaar").value) || 0;
  const dueDate = document.getElementById("userDueDate").value || null;

  const newUser = {
    id: users.length + 1,
    name: name,
    udhaar: udhaar,
    dueDate: dueDate,
  };

  users.push(newUser);
  saveData();
  displayUsers();
  hideUserModal();
  alert("User added successfully!");
}

function viewUserDetails(userId) {
  const user = users.find((u) => u.id === userId);
  if (!user) return;

  let details = "User Details:\n\n";
  details += `Name: ${user.name}\n`;
  details += `Udhaar Amount: PKR - ${user.udhaar}\n`;
  details += `Due Date: ${user.dueDate || "No due date"}\n\n`;

  const userOrders = orders.filter((o) => o.userId === userId);
  if (userOrders.length > 0) {
    details += "Order History:\n";
    userOrders.forEach((order) => {
      details += `\nOrder ID: ${order.id}\n`;
      details += `Date: ${order.date}\n`;
      details += `Amount: PKR - ${order.totalAmount}\n`;
      details += `Status: ${order.status}\n`;
    });
  } else {
    details += "No order history";
  }

  alert(details);
}

function editUser(userId) {
  const user = users.find((u) => u.id === userId);
  if (!user) return;

  document.getElementById("userModalTitle").textContent = "Edit User";
  document.getElementById("userName").value = user.name;
  document.getElementById("userUdhaar").value = user.udhaar;
  document.getElementById("userDueDate").value = user.dueDate || "";

  document.getElementById("userForm").onsubmit = (event) =>
    handleEditUser(event, userId);

  showUserModal();
}

function handleEditUser(event, userId) {
  event.preventDefault();

  const user = users.find((u) => u.id === userId);
  if (!user) return;

  user.name = document.getElementById("userName").value;
  user.udhaar = parseFloat(document.getElementById("userUdhaar").value) || 0;
  user.dueDate = document.getElementById("userDueDate").value || null;

  displayUsers();
  saveData();
  hideUserModal();
  alert("User updated successfully!");
}

function updateQuantityLimit(selectElement) {
  const selectedOption = selectElement.options[selectElement.selectedIndex];
  const stock = selectedOption.getAttribute("data-stock");
  const quantityInput =
    selectElement.parentElement.querySelector(".quantity-input");

  quantityInput.max = stock;
  quantityInput.value = "";
}

function validateQuantity(inputElement) {
  const selectElement =
    inputElement.parentElement.querySelector(".product-select");
  const selectedOption = selectElement.options[selectElement.selectedIndex];
  const stock = parseInt(selectedOption.getAttribute("data-stock"));
  const quantity = parseInt(inputElement.value);

  if (quantity > stock) {
    alert(`Maximum available stock is ${stock}`);
    inputElement.value = stock;
  } else if (quantity < 1) {
    alert("Minimum quantity is 1");
    inputElement.value = 1;
  }
}

function updateDashboardStats() {
  const userRole = localStorage.getItem("userRole");
  const userId = localStorage.getItem("userId");
  
  if (userRole === 'admin') {
    // Admin view - show all stats
    const totalRevenue = orders
      .filter((order) => order.status === "Paid")
      .reduce((sum, order) => sum + order.totalAmount, 0);

    const totalUdhaar = users.reduce((sum, user) => sum + user.udhaar, 0);

    const unpaidUsersCount = users.filter((user) => user.udhaar > 0).length;

    document.getElementById("totalRevenue").textContent = `PKR - ${totalRevenue}`;
    document.getElementById("totalUdhaar").textContent = `PKR - ${totalUdhaar}`;
    document.getElementById("totalUsers").textContent = users.length;
    document.getElementById("unpaidUsers").textContent = unpaidUsersCount;
    document.getElementById("totalProducts").textContent = products.length;
    document.getElementById("totalOrders").textContent = orders.length;
  } else {
    // Regular user view - show only their stats
    const user = users.find(u => u.id === parseInt(userId));
    if (user) {
      const userOrders = orders.filter(order => order.userId === parseInt(userId));
      const paidOrders = userOrders.filter(order => order.status === "Paid");
      const unpaidOrders = userOrders.filter(order => order.status === "Unpaid");
      
      const totalPaid = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const totalUnpaid = unpaidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      document.getElementById("totalRevenue").textContent = `PKR - ${totalPaid}`;
      document.getElementById("totalUdhaar").textContent = `PKR - ${totalUnpaid}`;
      document.getElementById("totalUsers").textContent = "1";
      document.getElementById("unpaidUsers").textContent = unpaidOrders.length > 0 ? "1" : "0";
      document.getElementById("totalProducts").textContent = products.length;
      document.getElementById("totalOrders").textContent = userOrders.length;
    }
  }

  updateTodayUdhaar();
  updateDuePayments();
}

function updateTodayUdhaar() {
  const userRole = localStorage.getItem("userRole");
  const userId = localStorage.getItem("userId");
  const todayUdhaarList = document.getElementById("todayUdhaarList");
  const today = new Date().toISOString().split("T")[0];

  let todayOrders;
  if (userRole === 'admin') {
    todayOrders = orders.filter(
      (order) => order.date === today && order.status === "Unpaid"
    );
  } else {
    todayOrders = orders.filter(
      (order) => order.date === today && order.status === "Unpaid" && order.userId === parseInt(userId)
    );
  }

  if (todayOrders.length === 0) {
    todayUdhaarList.innerHTML =
      '<div class="activity-item">No udhaar entries today</div>';
    return;
  }

  let html = "";
  todayOrders.forEach((order) => {
    const user = users.find((u) => u.id === order.userId);
    html += `
      <div class="activity-item">
        <div class="activity-info">
          <h4>${user.name}</h4>
          <p>${order.productData.length} items</p>
        </div>
        <span class="activity-amount">PKR - ${order.totalAmount}</span>
      </div>
    `;
  });

  todayUdhaarList.innerHTML = html;
}

function updateDuePayments() {
  const userRole = localStorage.getItem("userRole");
  const userId = localStorage.getItem("userId");
  const duePaymentsList = document.getElementById("duePaymentsList");
  const today = new Date();

  let dueUsers;
  if (userRole === 'admin') {
    dueUsers = users
      .filter((user) => user.udhaar > 0 && user.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  } else {
    dueUsers = users
      .filter((user) => user.id === parseInt(userId) && user.udhaar > 0 && user.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  if (dueUsers.length === 0) {
    duePaymentsList.innerHTML =
      '<div class="activity-item">No due payments</div>';
    return;
  }

  let html = "";
  dueUsers.forEach((user) => {
    const dueDate = new Date(user.dueDate);
    const isOverdue = dueDate < today;

    html += `
      <div class="activity-item ${isOverdue ? "overdue" : ""}">
        <div class="activity-info">
          <h4>${user.name}</h4>
          <p class="due-date">Due: ${user.dueDate}</p>
        </div>
        <span class="activity-amount">PKR - ${user.udhaar}</span>
      </div>
    `;
  });

  duePaymentsList.innerHTML = html;
}

function displayProductsList() {
  const productsList = document.getElementById("productsList");
  let html = `
    <table>
      <tr>
        <th>Name</th>
        <th>Price</th>
        <th>Stock</th>
        <th>Actions</th>
      </tr>
  `;

  products.forEach((product) => {
    html += `
      <tr>
        <td>${product.name}</td>
        <td>PKR - ${product.price}</td>
        <td>${product.stock}</td>
        <td>
          <button onclick="editProduct(${product.id})" class="action-btn">Edit</button>
          <button onclick="updateStock(${product.id})" class="action-btn">Update Stock</button>
        </td>
      </tr>
    `;
  });

  html += "</table>";
  productsList.innerHTML = html;
}

function displayOrdersList() {
  const ordersList = document.getElementById("ordersList");
  let html = `
    <table>
      <tr>
        <th>Order ID</th>
        <th>User</th>
        <th>Total Amount</th>
        <th>Status</th>
        <th>Date</th>
        <th>Actions</th>
      </tr>
  `;

  orders.forEach((order) => {
    const user = users.find((u) => u.id === order.userId);
    html += `
      <tr>
        <td>${order.id}</td>
        <td>${user ? user.name : "Unknown User"}</td>
        <td>PKR - ${order.totalAmount}</td>
        <td>${order.status}</td>
        <td>${order.date}</td>
        <td>
          <button onclick="viewOrderDetails(${
            order.id
          })" class="action-btn">View Details</button>
        </td>
      </tr>
    `;
  });

  html += "</table>";
  ordersList.innerHTML = html;
}

function searchProducts() {
  const searchTerm = document
    .getElementById("productSearch")
    .value.toLowerCase();
  const productsList = document.getElementById("productsList");

  let html = `
    <table>
      <tr>
        <th>Name</th>
        <th>Price</th>
        <th>Stock</th>
        <th>Actions</th>
      </tr>
  `;

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.price.toString().includes(searchTerm) ||
      product.stock.toString().includes(searchTerm)
  );

  filteredProducts.forEach((product) => {
    html += `
      <tr>
        <td>${product.name}</td>
        <td>PKR - ${product.price}</td>
        <td>${product.stock}</td>
        <td>
          <button onclick="editProduct(${product.id})" class="action-btn">Edit</button>
          <button onclick="updateStock(${product.id})" class="action-btn">Update Stock</button>
        </td>
      </tr>
    `;
  });

  html += "</table>";
  productsList.innerHTML = html;
}

function searchOrders() {
  const searchTerm = document.getElementById("orderSearch").value.toLowerCase();
  const ordersList = document.getElementById("ordersList");

  let html = `
    <table>
      <tr>
        <th>Order ID</th>
        <th>User</th>
        <th>Total Amount</th>
        <th>Status</th>
        <th>Date</th>
        <th>Actions</th>
      </tr>
  `;

  const filteredOrders = orders.filter((order) => {
    const user = users.find((u) => u.id === order.userId);
    return (
      (user && user.name.toLowerCase().includes(searchTerm)) ||
      order.status.toLowerCase().includes(searchTerm) ||
      order.date.includes(searchTerm) ||
      order.totalAmount.toString().includes(searchTerm)
    );
  });

  filteredOrders.forEach((order) => {
    const user = users.find((u) => u.id === order.userId);
    html += `
      <tr>
        <td>${order.id}</td>
        <td>${user ? user.name : "Unknown User"}</td>
        <td>PKR - ${order.totalAmount}</td>
        <td>${order.status}</td>
        <td>${order.date}</td>
        <td>
          <button onclick="viewOrderDetails(${order.id})" class="action-btn">
            View Details
          </button>
        </td>
      </tr>
    `;
  });

  html += "</table>";
  ordersList.innerHTML = html;
}

function searchUsers() {
  const searchTerm = document.getElementById("userSearch").value.toLowerCase();
  const usersList = document.getElementById("usersList");

  let html = `
    <table>
      <tr>
        <th>Name</th>
        <th>Udhaar Amount</th>
        <th>Due Date</th>
        <th>Actions</th>
      </tr>
  `;

  const filteredUsers = users
    .filter((user) => user.udhaar > 0)
    .filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm) ||
        user.udhaar.toString().includes(searchTerm) ||
        (user.dueDate && user.dueDate.includes(searchTerm))
    );

  filteredUsers.forEach((user) => {
    const isDueDate = user.dueDate && new Date(user.dueDate) < new Date();
    html += `
      <tr ${isDueDate ? 'class="overdue"' : ""}>
        <td>${user.name}</td>
        <td>PKR - ${user.udhaar}</td>
        <td>${user.dueDate || "No due date"}</td>
        <td>
          <button onclick="editUser(${
            user.id
          })" class="action-btn">Edit</button>
          <button onclick="viewUserDetails(${
            user.id
          })" class="action-btn">View Details</button>
          <button onclick="markAsPaid(${
            user.id
          })" class="action-btn paid-btn">Mark as Paid</button>
        </td>
      </tr>
    `;
  });

  html += "</table>";
  usersList.innerHTML = html;
}

showSection("overview");
