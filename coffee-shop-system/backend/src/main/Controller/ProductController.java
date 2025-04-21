@PostMapping("/api/products")
public ResponseEntity<?> addProduct(@RequestBody Product product) {
    try {
        ProductDAO dao = new ProductDAO();
        dao.insertProduct(product);
        return ResponseEntity.ok(Map.of("message", "Thêm sản phẩm thành công"));
    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Lỗi khi thêm sản phẩm"));
    }
}
