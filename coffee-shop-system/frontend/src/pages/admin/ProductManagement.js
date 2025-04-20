import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Modal, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

function ProductManagement() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    price: '',
    description: '',
    categoryId: '',
    isAvailable: true,
    image: ''
  });
  
  useEffect(() => {
    // Kiểm tra đăng nhập
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      const foundUser = JSON.parse(loggedInUser);
      setUser(foundUser);
      // Kiểm tra nếu không phải admin thì chuyển hướng
      if (foundUser.role !== 'admin') {
        navigate('/admin');
      }
    } else {
      navigate('/admin');
    }
    
    // Giả lập dữ liệu danh mục
    const dummyCategories = [
      { id: 1, name: 'Cà phê' },
      { id: 2, name: 'Trà' },
      { id: 3, name: 'Bánh ngọt' },
      { id: 4, name: 'Đồ ăn nhanh' },
      { id: 5, name: 'Nước ép' }
    ];
    
    setCategories(dummyCategories);
    
    // Giả lập dữ liệu sản phẩm
    const dummyProducts = [
      { id: 1, name: 'Cà phê đen', price: 25000, categoryId: 1, description: 'Cà phê đen đậm đà', isAvailable: true, image: 'https://via.placeholder.com/150' },
      { id: 2, name: 'Cà phê sữa', price: 30000, categoryId: 1, description: 'Cà phê sữa béo ngậy', isAvailable: true, image: 'https://via.placeholder.com/150' },
      { id: 3, name: 'Cappuccino', price: 45000, categoryId: 1, description: 'Cappuccino Ý truyền thống', isAvailable: true, image: 'https://via.placeholder.com/150' },
      { id: 4, name: 'Trà đào', price: 35000, categoryId: 2, description: 'Trà đào thơm mát', isAvailable: true, image: 'https://via.placeholder.com/150' },
      { id: 5, name: 'Trà sữa trân châu', price: 40000, categoryId: 2, description: 'Trà sữa với trân châu đường đen', isAvailable: true, image: 'https://via.placeholder.com/150' },
      { id: 6, name: 'Bánh flan', price: 15000, categoryId: 3, description: 'Bánh flan mềm mịn', isAvailable: false, image: 'https://via.placeholder.com/150' },
      { id: 7, name: 'Bánh tiramisu', price: 35000, categoryId: 3, description: 'Bánh tiramisu hương cà phê', isAvailable: true, image: 'https://via.placeholder.com/150' },
      { id: 8, name: 'Sandwich', price: 30000, categoryId: 4, description: 'Sandwich gà', isAvailable: true, image: 'https://via.placeholder.com/150' },
      { id: 9, name: 'Nước cam', price: 25000, categoryId: 5, description: 'Nước cam tươi', isAvailable: true, image: 'https://via.placeholder.com/150' },
      { id: 10, name: 'Sinh tố xoài', price: 35000, categoryId: 5, description: 'Sinh tố xoài ngọt mát', isAvailable: true, image: 'https://via.placeholder.com/150' }
    ];
    
    setProducts(dummyProducts);
    
  }, [navigate]);
  
  const sidebarItems = [
    { name: 'Tổng quan', path: '/admin/dashboard', icon: 'bi-speedometer2' },
    { name: 'Quản lý Sản phẩm', path: '/admin/products', icon: 'bi-cup-hot' },
    { name: 'Quản lý Danh mục', path: '/admin/categories', icon: 'bi-list-nested' },
    { name: 'Quản lý Tài khoản', path: '/admin/accounts', icon: 'bi-people' },
    { name: 'Quản lý Bàn', path: '/admin/tables', icon: 'bi-grid' },
    { name: 'Quản lý Khuyến mãi', path: '/admin/promotions', icon: 'bi-percent' },
    { name: 'Quản lý Đơn hàng', path: '/admin/orders', icon: 'bi-receipt' },
    { name: 'Báo cáo Thống kê', path: '/admin/reports', icon: 'bi-bar-chart' },
  ];
  
  const handleAddProduct = () => {
    setCurrentProduct(null);
    setFormData({
      id: '',
      name: '',
      price: '',
      description: '',
      categoryId: categories.length > 0 ? categories[0].id : '',
      isAvailable: true,
      image: 'https://via.placeholder.com/150'
    });
    setShowModal(true);
  };
  
  const handleEditProduct = (product) => {
    setCurrentProduct(product);
    setFormData({
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
      categoryId: product.categoryId,
      isAvailable: product.isAvailable,
      image: product.image
    });
    setShowModal(true);
  };
  
  const handleDeleteProduct = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      // Trong thực tế, bạn sẽ gọi API để xóa
      const updatedProducts = products.filter(product => product.id !== id);
      setProducts(updatedProducts);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.price || !formData.categoryId) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    // Tạo đối tượng sản phẩm mới từ form
    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      categoryId: parseInt(formData.categoryId)
    };
    
    if (currentProduct) {
      // Cập nhật sản phẩm đã tồn tại
      const updatedProducts = products.map(p => 
        p.id === currentProduct.id ? { ...productData, id: currentProduct.id } : p
      );
      setProducts(updatedProducts);
    } else {
      // Thêm sản phẩm mới
      const newId = Math.max(...products.map(p => p.id)) + 1;
      setProducts([...products, { ...productData, id: newId }]);
    }
    
    setShowModal(false);
  };
  
  const handleToggleStatus = (id) => {
    const updatedProducts = products.map(product => 
      product.id === id ? { ...product, isAvailable: !product.isAvailable } : product
    );
    setProducts(updatedProducts);
  };
  
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '';
  };
  
  // Lọc sản phẩm theo tìm kiếm và danh mục
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.categoryId === parseInt(selectedCategory);
    return matchesSearch && matchesCategory;
  });
  
  if (!user) return null;
  
  return (
    <div className="d-flex">
      <Sidebar items={sidebarItems} userRole="admin" />
      
      <Container fluid className="ms-sm-auto px-md-4 py-4">
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Quản lý Sản phẩm</h1>
          <Button variant="primary" onClick={handleAddProduct}>
            Thêm Sản phẩm
          </Button>
        </div>
        
        <Card className="mb-4">
          <Card.Body>
            <Row className="mb-3">
              <Col md={6}>
                <InputGroup>
                  <Form.Control
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button variant="outline-secondary">
                    <i className="bi bi-search"></i>
                  </Button>
                </InputGroup>
              </Col>
              <Col md={6}>
                <Form.Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">Tất cả danh mục</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
            
            <Table responsive striped bordered hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Hình ảnh</th>
                  <th>Tên sản phẩm</th>
                  <th>Giá</th>
                  <th>Danh mục</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        width="50" 
                        height="50" 
                        style={{ objectFit: 'cover' }}
                      />
                    </td>
                    <td>{product.name}</td>
                    <td>{product.price.toLocaleString('vi-VN')} đ</td>
                    <td>{getCategoryName(product.categoryId)}</td>
                    <td>
                      <Form.Check
                        type="switch"
                        id={`status-switch-${product.id}`}
                        checked={product.isAvailable}
                        onChange={() => handleToggleStatus(product.id)}
                        label={product.isAvailable ? 'Có sẵn' : 'Hết hàng'}
                      />
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleEditProduct(product)}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
        
        {/* Modal thêm/sửa sản phẩm */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              {currentProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tên sản phẩm</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Nhập tên sản phẩm"
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Giá</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="Nhập giá sản phẩm"
                        required
                      />
                      <InputGroup.Text>đ</InputGroup.Text>
                    </InputGroup>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Danh mục</Form.Label>
                    <Form.Select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Mô tả</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Mô tả sản phẩm"
                    />
                  </Form.Group>
                </Col>
                
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Hình ảnh</Form.Label>
                    <div className="text-center mb-3">
                      <img
                        src={formData.image || 'https://via.placeholder.com/150'}
                        alt="Preview"
                        className="img-thumbnail"
                        style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                      />
                    </div>
                    <Form.Control
                      type="text"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      placeholder="URL hình ảnh"
                    />
                    <Form.Text className="text-muted">
                      Nhập URL hình ảnh hoặc tải lên.
                    </Form.Text>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      name="isAvailable"
                      checked={formData.isAvailable}
                      onChange={handleInputChange}
                      label="Sản phẩm có sẵn"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Hủy
              </Button>
              <Button variant="primary" type="submit">
                {currentProduct ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </div>
  );
}

export default ProductManagement; 