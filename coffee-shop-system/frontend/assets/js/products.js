document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("productForm");
    if (!form) return;
  
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
  
      const name = form.name.value;
      const price = parseFloat(form.price.value);
      const description = form.description.value;
      const available = form.available.checked;
  
      // Convert ảnh sang base64 nếu có
      let imageBase64 = null;
      const imageFile = form.image.files[0];
      if (imageFile) {
        const reader = new FileReader();
        reader.onload = async function () {
          imageBase64 = reader.result.split(",")[1];
          await submitProduct();
        };
        reader.readAsDataURL(imageFile);
      } else {
        await submitProduct();
      }
  
      async function submitProduct() {
        const data = {
          name,
          price,
          description,
          image: imageBase64,
          available
        };
  
        try {
          const response = await fetch("http://localhost:8080/api/products", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
  
          const result = await response.json();
          document.getElementById("statusMsg").innerText = result.message || "Thêm món thành công!";
          form.reset();
        } catch (error) {
          console.error("Lỗi khi gửi:", error);
          document.getElementById("statusMsg").innerText = "Có lỗi xảy ra!";
        }
      }
    });
  });
  