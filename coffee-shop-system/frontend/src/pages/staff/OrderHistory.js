import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Kiểm tra đăng nhập
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      navigate('/staff');
      return;
    }
    
    // Set ngày mặc định (7 ngày gần đây)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
    
    // Load dữ liệu đơn hàng
    loadOrderHistory(formatDate(start), formatDate(end));
  }, [navigate]);
  
  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  
  const loadOrderHistory = (start, end) => {
    // Giả lập dữ liệu đơn hàng
    const dummyOrders = [];
    
    // Tạo 20 đơn hàng giả lập
    for (let i = 1; i <= 20; i++) {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 7)); // Ngẫu nhiên trong 7 ngày gần đây
      
      dummyOrders.push({
        id: 1000 + i,
        tableNumber: Math.floor(Math.random() * 16) + 1,
        totalAmount: Math.floor(Math.random() * 500000) + 50000,
        items: Math.floor(Math.random() * 10) + 1,
        status: Math.random() > 0.2 ? 'Đã thanh toán' : 'Đã hủy',
        date: orderDate.toLocaleString(),
        staff: 'Nhân viên ' + (Math.floor(Math.random() * 3) + 1)
      });
    }
    
    // Sắp xếp theo thời gian gần nhất
    dummyOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setOrders(dummyOrders);
  };
  
  const handleSearch = () => {
    loadOrderHistory(startDate, endDate);
  };
  
  const sidebarItems = [
    { name: 'Tổng quan', path: '/staff/dashboard', icon: 'bi-speedometer2' },
    { name: 'Quản lý Bàn', path: '/staff/tables', icon: 'bi-grid' },
    { name: 'Đặt món', path: '/staff/order', icon: 'bi-cart-plus' },
    { name: 'Thanh toán', path: '/staff/payment', icon: 'bi-credit-card' },
    { name: 'Lịch sử đơn hàng', path: '/staff/history', icon: 'bi-clock-history' },
  ];
  
  const handleViewDetail = (orderId) => {
    // Trong thực tế, bạn sẽ điều hướng đến trang chi tiết đơn hàng
    console.log('Xem chi tiết đơn hàng:', orderId);
  };
  
  return (
    <div className="d-flex">
      <Sidebar items={sidebarItems} userRole="staff" />
      
      <Container fluid className="ms-sm-auto px-md-4 py-4">
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Lịch sử đơn hàng</h1>
        </div>
        
        <Row className="mb-4">
          <Col md={10}>
            <Form className="d-flex gap-2">
              <Form.Group>
                <Form.Label>Từ ngày</Form.Label>
                <Form.Control 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Form.Group>
              
              <Form.Group>
                <Form.Label>Đến ngày</Form.Label>
                <Form.Control 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Form.Group>
              
              <Button 
                variant="primary"
                className="align-self-end"
                onClick={handleSearch}
              >
                Tìm kiếm
              </Button>
            </Form>
          </Col>
        </Row>
        
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Bàn</th>
              <th>Tổng tiền</th>
              <th>Số món</th>
              <th>Trạng thái</th>
              <th>Thời gian</th>
              <th>Nhân viên</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>Bàn {order.tableNumber}</td>
                <td>{order.totalAmount.toLocaleString('vi-VN')} đ</td>
                <td>{order.items}</td>
                <td>
                  <span className={`badge ${order.status === 'Đã thanh toán' ? 'bg-success' : 'bg-danger'}`}>
                    {order.status}
                  </span>
                </td>
                <td>{order.date}</td>
                <td>{order.staff}</td>
                <td>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => handleViewDetail(order.id)}
                  >
                    Chi tiết
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>
    </div>
  );
}

export default OrderHistory; 