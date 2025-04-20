import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Tab, Nav, ListGroup, Alert } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

function OrderPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tables, setTables] = useState([]);
  const [orderNote, setOrderNote] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Kiểm tra đăng nhập
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      navigate('/staff');
      return;
    }
    
    // Lấy tableId từ URL nếu có
    const params = new URLSearchParams(location.search);
    const tableId = params.get('tableId');
    
    // Giả lập dữ liệu bàn
    const dummyTables = Array.from({ length: 16 }, (_, i) => ({
      id: i + 1,
      number: i + 1,
      capacity: 4,
      isAvailable: !tableId || tableId != i + 1 // Nếu có tableId, thì bàn đó là không khả dụng
    }));
    
    setTables(dummyTables);
    
    if (tableId) {
      const table = dummyTables.find(t => t.id === parseInt(tableId));
      if (table) {
        setSelectedTable(table);
      }
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
      { id: 1, name: 'Cà phê đen', price: 25000, categoryId: 1, image: 'https://via.placeholder.com/150' },
      { id: 2, name: 'Cà phê sữa', price: 30000, categoryId: 1, image: 'https://via.placeholder.com/150' },
      { id: 3, name: 'Cappuccino', price: 45000, categoryId: 1, image: 'https://via.placeholder.com/150' },
      { id: 4, name: 'Trà đào', price: 35000, categoryId: 2, image: 'https://via.placeholder.com/150' },
      { id: 5, name: 'Trà sữa trân châu', price: 40000, categoryId: 2, image: 'https://via.placeholder.com/150' },
      { id: 6, name: 'Bánh flan', price: 15000, categoryId: 3, image: 'https://via.placeholder.com/150' },
      { id: 7, name: 'Bánh tiramisu', price: 35000, categoryId: 3, image: 'https://via.placeholder.com/150' },
      { id: 8, name: 'Sandwich', price: 30000, categoryId: 4, image: 'https://via.placeholder.com/150' },
      { id: 9, name: 'Nước cam', price: 25000, categoryId: 5, image: 'https://via.placeholder.com/150' },
      { id: 10, name: 'Sinh tố xoài', price: 35000, categoryId: 5, image: 'https://via.placeholder.com/150' }
    ];
    
    setProducts(dummyProducts);
    
  }, [navigate, location.search]);
  
  const sidebarItems = [
    { name: 'Tổng quan', path: '/staff/dashboard', icon: 'bi-speedometer2' },
    { name: 'Quản lý Bàn', path: '/staff/tables', icon: 'bi-grid' },
    { name: 'Đặt món', path: '/staff/order', icon: 'bi-cart-plus' },
    { name: 'Thanh toán', path: '/staff/payment', icon: 'bi-credit-card' },
    { name: 'Lịch sử đơn hàng', path: '/staff/history', icon: 'bi-clock-history' },
  ];
  
  const handleAddToCart = (product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      // Nếu sản phẩm đã có trong giỏ hàng, tăng số lượng
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      // Nếu sản phẩm chưa có trong giỏ hàng, thêm mới
      setCart([...cart, { product, quantity: 1 }]);
    }
  };
  
  const handleRemoveFromCart = (productId) => {
    const updatedCart = cart.filter(item => item.product.id !== productId);
    setCart(updatedCart);
  };
  
  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    
    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: newQuantity } 
        : item
    ));
  };
  
  const handleTableSelect = (table) => {
    setSelectedTable(table);
  };
  
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };
  
  const handlePlaceOrder = () => {
    if (!selectedTable) {
      alert('Vui lòng chọn bàn trước khi đặt món');
      return;
    }
    
    if (cart.length === 0) {
      alert('Vui lòng thêm ít nhất một món vào giỏ hàng');
      return;
    }
    
    // Trong thực tế, bạn sẽ gửi đơn hàng đến API
    console.log('Đặt đơn hàng:', {
      tableId: selectedTable.id,
      items: cart,
      totalAmount: calculateTotal(),
      note: orderNote
    });
    
    // Cập nhật trạng thái bàn
    const updatedTables = tables.map(t => 
      t.id === selectedTable.id ? { ...t, isAvailable: false } : t
    );
    setTables(updatedTables);
    
    // Hiển thị thông báo thành công
    setOrderSuccess(true);
    
    // Reset giỏ hàng và ghi chú
    setCart([]);
    setOrderNote('');
    
    // Sau 3 giây, chuyển về trang quản lý bàn
    setTimeout(() => {
      navigate('/staff/tables');
    }, 3000);
  };
  
  const getProductsByCategory = (categoryId) => {
    return products.filter(product => product.categoryId === categoryId);
  };
  
  return (
    <div className="d-flex">
      <Sidebar items={sidebarItems} userRole="staff" />
      
      <Container fluid className="ms-sm-auto px-md-4 py-4">
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Đặt món</h1>
        </div>
        
        {orderSuccess && (
          <Alert variant="success" className="mb-4">
            Đặt món thành công! Đang chuyển hướng về trang quản lý bàn...
          </Alert>
        )}
        
        <Row>
          <Col md={8}>
            {!selectedTable ? (
              <div className="mb-4">
                <h4>Chọn bàn</h4>
                <div className="table-container">
                  {tables.filter(table => table.isAvailable).map(table => (
                    <div 
                      key={table.id}
                      className="table-item table-available"
                      onClick={() => handleTableSelect(table)}
                    >
                      <div>
                        <h4>Bàn {table.number}</h4>
                        <small>{table.capacity} người</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <h4>
                  Bàn đã chọn: <Badge bg="success">Bàn {selectedTable.number}</Badge>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    className="ms-2"
                    onClick={() => setSelectedTable(null)}
                  >
                    Thay đổi
                  </Button>
                </h4>
              </div>
            )}
            
            <Tab.Container defaultActiveKey={categories.length > 0 ? categories[0].id : 0}>
              <Nav variant="tabs" className="category-tabs mb-3">
                {categories.map(category => (
                  <Nav.Item key={category.id}>
                    <Nav.Link eventKey={category.id}>{category.name}</Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>
              
              <Tab.Content>
                {categories.map(category => (
                  <Tab.Pane key={category.id} eventKey={category.id}>
                    <Row>
                      {getProductsByCategory(category.id).map(product => (
                        <Col key={product.id} md={4} sm={6} className="mb-4">
                          <Card className="product-card h-100">
                            <Card.Img variant="top" src={product.image} className="product-img" />
                            <Card.Body>
                              <Card.Title>{product.name}</Card.Title>
                              <Card.Text>
                                {product.price.toLocaleString('vi-VN')} đ
                              </Card.Text>
                              <Button 
                                variant="primary" 
                                onClick={() => handleAddToCart(product)}
                                className="w-100"
                              >
                                Thêm vào giỏ
                              </Button>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Tab.Pane>
                ))}
              </Tab.Content>
            </Tab.Container>
          </Col>
          
          <Col md={4}>
            <div className="order-summary">
              <h4 className="mb-3">Giỏ hàng</h4>
              
              {cart.length === 0 ? (
                <p className="text-muted">Chưa có món nào được thêm vào giỏ hàng</p>
              ) : (
                <>
                  <ListGroup className="mb-3">
                    {cart.map(item => (
                      <ListGroup.Item key={item.product.id}>
                        <div className="d-flex justify-content-between">
                          <div>
                            <h6>{item.product.name}</h6>
                            <small className="text-muted">
                              {item.product.price.toLocaleString('vi-VN')} đ
                            </small>
                          </div>
                          <div className="d-flex align-items-center">
                            <Button 
                              variant="outline-secondary" 
                              size="sm"
                              onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="mx-2">{item.quantity}</span>
                            <Button 
                              variant="outline-secondary" 
                              size="sm"
                              onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Ghi chú</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={3} 
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder="Nhập ghi chú cho đơn hàng"
                    />
                  </Form.Group>
                  
                  <div className="d-flex justify-content-between mb-3">
                    <h5>Tổng cộng:</h5>
                    <h5>{calculateTotal().toLocaleString('vi-VN')} đ</h5>
                  </div>
                  
                  <Button 
                    variant="success" 
                    className="w-100"
                    onClick={handlePlaceOrder}
                    disabled={!selectedTable || cart.length === 0}
                  >
                    Đặt món
                  </Button>
                </>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default OrderPage; 