document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
  
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorDiv = document.getElementById("loginError");
  
    fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.token && data.role) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("role", data.role);
  
          if (data.role === "admin") {
            window.location.href = "../admin/dashboard.html";
          } else if (data.role === "staff") {
            window.location.href = "../staff/table.html";
          } else {
            errorDiv.textContent = "Unauthorized role.";
          }
        } else {
          errorDiv.textContent = data.message || "Login failed.";
        }
      })
      .catch(err => {
        console.error("Login error:", err);
        errorDiv.textContent = "Login failed. Try again.";
      });
  });
  