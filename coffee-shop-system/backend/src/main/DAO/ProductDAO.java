public class ProductDAO {
    private Connection conn;

    public ProductDAO(Connection conn) {
        this.conn = conn;
    }

    public List<Product> getAllAvailableProducts() throws SQLException {
        List<Product> products = new ArrayList<>();
        String sql = "SELECT * FROM Product WHERE Is_Available = 1";
        PreparedStatement stmt = conn.prepareStatement(sql);
        ResultSet rs = stmt.executeQuery();

        while (rs.next()) {
            Product p = new Product();
            p.setId(rs.getInt("ID_Product"));
            p.setName(rs.getString("Product_Name"));
            p.setPrice(rs.getDouble("Price"));
            p.setDescription(rs.getString("Description"));
            p.setImage(rs.getBytes("Image"));
            p.setAvailable(rs.getBoolean("Is_Available"));
            products.add(p);
        }

        return products;
    }
}
