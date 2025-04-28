// checkout.js

document.addEventListener("DOMContentLoaded", function () {
    loadTables();
    loadOrderSummary();
    setupPlaceOrder();
  });
  
  // Load table numbers dynamically (dummy data or from API)
  function loadTables() {
    const tableSelect = document.getElementById("tableNumber");
    for (let i = 1; i <= 10; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = `Table ${i}`;
      tableSelect.appendChild(option);
    }
  }
  
  // Load order summary from cart (from localStorage)
  function loadOrderSummary() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const summaryDiv = document.getElementById("orderSummary");
    summaryDiv.innerHTML = "";
    let total = 0;
  
    cart.forEach((item) => {
      const itemDiv = document.createElement("div");
      itemDiv.classList.add("summary-item");
      itemDiv.innerHTML = `
        <p><strong>${item.name}</strong> x ${item.quantity}</p>
        <p>$${(item.price * item.quantity).toFixed(2)}</p>
      `;
      total += item.price * item.quantity;
      summaryDiv.appendChild(itemDiv);
    });
  
    const totalDiv = document.createElement("div");
    totalDiv.classList.add("summary-total");
    totalDiv.innerHTML = `<h4>Total: $${total.toFixed(2)}</h4>`;
    summaryDiv.appendChild(totalDiv);
  }
  
  // Setup Place Order button
  function setupPlaceOrder() {
    const btn = document.getElementById("placeOrderBtn");
    btn.addEventListener("click", function () {
      const fullName = document.getElementById("fullName").value;
      const phone = document.getElementById("phone").value;
      const tableNumber = document.getElementById("tableNumber").value;
      const notes = document.getElementById("notes").value;
      const paymentMethod = document.querySelector("input[name='payment']:checked").value;
  
      if (!fullName || !phone || !tableNumber) {
        alert("Please complete all required fields.");
        return;
      }
  
      const order = {
        customer: {
          fullName,
          phone,
          tableNumber,
          notes,
        },
        cart: JSON.parse(localStorage.getItem("cart")) || [],
        paymentMethod,
        totalAmount: calculateTotal(),
      };
  
      if (paymentMethod === "mobile") {
        showQRCode(order);
      } else if (paymentMethod === "cash") {
        alert("Thank you! Please proceed to the counter to pay. Your order will be processed.");
        createOrder(order);
      } else {
        alert("Card payments are coming soon.");
      }
    });
  }
  
  function calculateTotal() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }
  
  function showQRCode(order) {
    const qrSection = document.createElement("div");
    qrSection.classList.add("qr-section");
    qrSection.innerHTML = `
      <h3>Scan to Pay (Valid for 5 minutes)</h3>
      <img src="https://api.qrserver.com/v1/create-qr-code/?data=pay-t2k-${Date.now()}&size=200x200" alt="QR Code">
      <p id="countdown">5:00</p>
    `;
    document.querySelector(".checkout-container").appendChild(qrSection);
  
    startCountdown(5 * 60, document.getElementById("countdown"));
  
    // Simulate success after 5 seconds (replace with real payment check later)
    setTimeout(() => {
      alert("Payment successful! Your order has been placed.");
      createOrder(order);
    }, 5000);
  }
  
  function startCountdown(seconds, display) {
    let remaining = seconds;
    const timer = setInterval(() => {
      const minutes = Math.floor(remaining / 60);
      const secondsLeft = remaining % 60;
      display.textContent = `${minutes}:${secondsLeft < 10 ? "0" : ""}${secondsLeft}`;
      remaining--;
      if (remaining < 0) {
        clearInterval(timer);
        display.textContent = "QR Code expired.";
      }
    }, 1000);
  }
  
  function createOrder(order) {
    console.log("Order created:", order);
    localStorage.removeItem("cart");
    // TODO: Gửi order đến backend bằng fetch()
  } 
  