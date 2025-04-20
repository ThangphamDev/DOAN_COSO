import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Kiểm tra đăng nhập
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      navigate('/admin');
      return;
    }
    
    // Set ngày mặc định (7 ngày gần đây)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    
    setDateRange({
      startDate: formatDate(start),
      endDate: formatDate(end)
    });
    
    // Giả lập dữ liệu đơn hàng
    const dummyOrders = [];
    
    // Tạo 50 đơn hàng giả lập
    for (let i = 1; i <= 50; i++) {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30)); // Ngẫu nhiên trong 30 ngày gần đây
      
      const status = Math.random();
      let orderStatus;
      if (status < 0.6) {
        orderStatus = 'completed'; // 60% hoàn thành
      } else if (status < 0.8) {
        orderStatus = 'processing'; // 20% đang xử lý
      } else {
        orderStatus = 'cancelled'; // 20% đã hủy
      }
      
      const items = [];
      const itemCount = Math.floor(Math.random() * 5) + 1;
      let totalAmount = 0;
      
      for (let j = 1; j <= itemCount; j++) {
        const price = Math.floor(Math.random() * 50000) + 10000;
        const quantity = Math.floor(Math.random() * 3) + 1;
        totalAmount += price * quantity;
        
        items.push({
          id: j,
          name: `Sản phẩm ${j}`,
          price: price,
          quantity: quantity
        });
      }
      
      dummyOrders.push({
        id: 1000 + i,
        tableNumber: Math.floor(Math.random() * 16) + 1,
        items: items,
        totalAmount: totalAmount,
        date: orderDate.toISOString(),
        status: orderStatus,
        staff: `Nhân viên ${Math.floor(Math.random() * 3) + 1}`
      });
    }
    
    // Sắp xếp theo thời gian gần nhất
    dummyOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setOrders(dummyOrders);
    setFilteredOrders(dummyOrders);
  }, [navigate]);
  
  useEffect(() => {
    // Lọc đơn hàng theo trạng thái và khoảng thời gian
    let result = [...orders];
    
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    if (dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999); // Đặt thời gian là cuối ngày
      
      result = result.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= start && orderDate <= end;
      });
    }
    
    setFilteredOrders(result);
  }, [statusFilter, dateRange, orders]);
  
  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  
  const formatDateTime = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString('vi-VN', options);
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge bg="success">Hoàn thành</Badge>;
      case 'processing':
        return <Badge bg="primary">Đang xử lý</Badge>;
      case 'cancelled':
        return <Badge bg="danger">Đã hủy</Badge>;
      default:
        return <Badge bg="secondary">Không xác định</Badge>;
    }
  };
  
  const handleSearch = () => {
    // Đã được xử lý trong useEffect
  };
  
  const handleViewDetail = (order) => {
    setCurrentOrder(order);
    setShowDetailModal(true);
  };
  
  const sidebarItems = [
    { name: 'Tổng quan', path: '/admin/dashboard', icon: 'bi-speedometer2' },
    { name: 'Quản lý Sản phẩm', path: '/admin/products', icon: 'bi-cup-hot' },
    { name: 'Quản lý Danh mục', path: '/admin/categories', icon: 'bi-list-nested' },
    { name: 'Quản lý Tài khoản', path: '/admin/accounts', icon: 'bi-people' },
    { name: 'Quản lý Bàn', path: '/admin/tables', icon: 'bi-grid' },
    { name: 'Quản lý Khuyến mãi', path: '/admin/promotions', icon: 'bi-tag' },
    { name: 'Quản lý Đơn hàng', path: '/admin/orders', icon: 'bi-receipt' },
    { name: 'Báo cáo', path: '/admin/reports', icon: 'bi-bar-chart' }
  ];
  
  return (
    <div className="d-flex">
      <Sidebar items={sidebarItems} userRole="admin" />
      
      <Container fluid className="ms-sm-auto px-md-4 py-4">
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Quản lý Đơn hàng</h1>
        </div>
        
        <Card className="mb-4">
          <Card.Body>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Từ ngày</Form.Label>
                  <Form.Control 
                    type="date" 
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
              
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Đến ngày</Form.Label>
                  <Form.Control 
                    type="date" 
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
              
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Tất cả</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="processing">Đang xử lý</option>
                    <option value="cancelled">Đã hủy</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={3} className="d-flex align-items-end">
                <Button 
                  variant="primary"
                  className="mb-3 w-100"
                  onClick={handleSearch}
                >
                  Tìm kiếm
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        <Card>
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Bàn</th>
                  <th>Thời gian</th>
                  <th>Số món</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Nhân viên</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>Bàn {order.tableNumber}</td>
                    <td>{formatDateTime(order.date)}</td>
                    <td>{order.items.length}</td>
                    <td>{order.totalAmount.toLocaleString('vi-VN')} đ</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>{order.staff}</td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => handleViewDetail(order)}
                      >
                        Chi tiết
                      </Button>
                    </td>
                  </tr>
                ))}
                
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-3">
                      Không có đơn hàng nào phù hợp với điều kiện tìm kiếm
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
        
        {/* Modal Chi tiết đơn hàng */}
        <Modal 
          show={showDetailModal} 
          onHide={() => setShowDetailModal(false)}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Chi tiết đơn hàng #{currentOrder?.id}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {currentOrder && (
              <>
                <Row className="mb-4">
                  <Col md={6}>
                    <p><strong>Bàn:</strong> Bàn {currentOrder.tableNumber}</p>
                    <p><strong>Thời gian:</strong> {formatDateTime(currentOrder.date)}</p>
                    <p><strong>Nhân viên:</strong> {currentOrder.staff}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Trạng thái:</strong> {getStatusBadge(currentOrder.status)}</p>
                    <p><strong>Tổng tiền:</strong> {currentOrder.totalAmount.toLocaleString('vi-VN')} đ</p>
                  </Col>
                </Row>
                
                <h5>Danh sách món</h5>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Tên món</th>
                      <th>Đơn giá</th>
                      <th>Số lượng</th>
                      <th>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrder.items.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>{item.name}</td>
                        <td>{item.price.toLocaleString('vi-VN')} đ</td>
                        <td>{item.quantity}</td>
                        <td>{(item.price * item.quantity).toLocaleString('vi-VN')} đ</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th colSpan="4" className="text-end">Tổng cộng:</th>
                      <th>{currentOrder.totalAmount.toLocaleString('vi-VN')} đ</th>
                    </tr>
                  </tfoot>
                </Table>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
              Đóng
            </Button>
            {currentOrder && currentOrder.status === 'processing' && (
              <>
                <Button 
                  variant="success" 
                  onClick={() => {
                    const updatedOrders = orders.map(order => 
                      order.id === currentOrder.id ? { ...order, status: 'completed' } : order
                    );
                    setOrders(updatedOrders);
                    setCurrentOrder({ ...currentOrder, status: 'completed' });
                  }}
                >
                  Hoàn thành
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => {
                    const updatedOrders = orders.map(order => 
                      order.id === currentOrder.id ? { ...order, status: 'cancelled' } : order
                    );
                    setOrders(updatedOrders);
                    setCurrentOrder({ ...currentOrder, status: 'cancelled' });
                  }}
                >
                  Hủy đơn
                </Button>
              </>
            )}
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
}

export default OrderManagement; 