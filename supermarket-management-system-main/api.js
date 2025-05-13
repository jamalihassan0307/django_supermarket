async function getProducts() {
  return products;
}

async function getProduct(id) {
  return products.find((product) => product.id === id);
}

async function createProduct(product) {
  product.id = Date.now().toString();
  products.push(product);
  saveData();
  return product;
}

async function updateProduct(id, product) {
  const index = products.findIndex((p) => p.id === id);
  if (index !== -1) {
    products[index] = { ...products[index], ...product };
    saveData();
    return products[index];
  }
  return null;
}

async function deleteProduct(id) {
  const index = products.findIndex((p) => p.id === id);
  if (index !== -1) {
    products.splice(index, 1);
    saveData();
  }
}

async function getOrders() {
  return orders;
}

async function getOrder(id) {
  return orders.find((order) => order.id === id);
}

async function createOrder(order) {
  if (
    !order.productData ||
    !Array.isArray(order.productData) ||
    order.productData.length === 0
  ) {
    throw new Error("No products selected!");
  }

  for (const item of order.productData) {
    if (!item.productId || !item.quantity) {
      throw new Error("Invalid product data!");
    }

    const product = products.find(
      (p) => p.id.toString() === item.productId.toString()
    );
    if (!product) {
      throw new Error("Invalid product selection!");
    }

    if (product.stock < item.quantity) {
      throw new Error(
        `Not enough stock for ${product.name}! Available: ${product.stock}`
      );
    }
  }

  order.id = Date.now().toString();
  orders.push(order);
  saveData();
  return order;
}

async function updateOrder(id, order) {
  const index = orders.findIndex((o) => o.id === id);
  if (index !== -1) {
    orders[index] = { ...orders[index], ...order };
    saveData();
    return orders[index];
  }
  return null;
}

async function deleteOrder(id) {
  const index = orders.findIndex((o) => o.id === id);
  if (index !== -1) {
    orders.splice(index, 1);
    saveData();
  }
}
