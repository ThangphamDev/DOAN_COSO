import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import main.model.Product;

public class ProductDAO {
    private Connection conn;

    public ProductDAO(Connection conn) {
        this.conn = conn;
    }

    public List<Product> getAllAvailableProducts() throws SQLException {
        List<Product> products = new ArrayList<>();
        String sql = "SELECT * FROM product WHERE Is_Available = 1";
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
            p.setCategoryId(rs.getInt("ID_Category"));
            products.add(p);
        }

        return products;
    }
    
    public void insertProduct(Product product) throws SQLException {
        String sql = "INSERT INTO product (Product_Name, Price, Description, Image, Is_Available, ID_Category) VALUES (?, ?, ?, ?, ?, ?)";
        PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
        stmt.setString(1, product.getName());
        stmt.setDouble(2, product.getPrice());
        stmt.setString(3, product.getDescription());
        stmt.setBytes(4, product.getImage());
        stmt.setBoolean(5, product.isAvailable());
        stmt.setInt(6, product.getCategoryId());
        
        stmt.executeUpdate();
        
        // Get generated ID
        ResultSet generatedKeys = stmt.getGeneratedKeys();
        if (generatedKeys.next()) {
            product.setId(generatedKeys.getInt(1));
        }
    }

    public List<Product> getFeaturedProducts(Integer limit) throws SQLException {
        List<Product> products = new ArrayList<>();

        String sql = "SELECT * FROM product WHERE Is_Available = 1 ORDER BY Price DESC";
        
        if (limit != null && limit > 0) {
            sql += " LIMIT ?";
        }
        
        PreparedStatement stmt = conn.prepareStatement(sql);
        
        if (limit != null && limit > 0) {
            stmt.setInt(1, limit);
        }
        
        ResultSet rs = stmt.executeQuery();

        while (rs.next()) {
            Product p = new Product();
            p.setId(rs.getInt("ID_Product"));
            p.setName(rs.getString("Product_Name"));
            p.setPrice(rs.getDouble("Price"));
            p.setDescription(rs.getString("Description"));
            p.setImage(rs.getBytes("Image"));
            p.setAvailable(rs.getBoolean("Is_Available"));
            p.setCategoryId(rs.getInt("ID_Category"));
            products.add(p);
        }

        return products;
    }
}
