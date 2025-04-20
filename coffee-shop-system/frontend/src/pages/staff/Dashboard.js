import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Kiểm tra đăng nhập
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      const foundUser = JSON.parse(loggedInUser);
      setUser(foundUser);
    } else {
      navigate('/staff');
    }
  }, [navigate]);

  const sidebarItems = [
    { name: 'Tổng quan', path: '/staff/dashboard', icon: 'bi-speedometer2' },
    { name: 'Quản lý Bàn', path: '/staff/tables', icon: 'bi-grid' },
    { name: 'Đặt món', path: '/staff/order', icon: 'bi-cart-plus' },
    { name: 'Thanh toán', path: '/staff/payment', icon: 'bi-credit-card' },
    { name: 'Lịch sử đơn hàng', path: '/staff/history', icon: 'bi-clock-history' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/staff');
  };

  if (!user) return null;

  return (
    <div className="d-flex">
      <Sidebar items={sidebarItems} userRole="staff" />
      
      <Container fluid className="ms-sm-auto px-md-4 py-4 main-content">
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Tổng quan</h1>
          <Button variant="outline-secondary" onClick={handleLogout}>
            Đăng xuất
          </Button>
        </div>
        
        <Row>
          <Col md={4} className="mb-4">
            <Card className="h-100">
              <Card.Body className="d-flex flex-column">
                <Card.Title>Quản lý Bàn</Card.Title>
                <Card.Text>
                  Xem trạng thái các bàn, đặt bàn cho khách hàng
                </Card.Text>
                <Button 
                  variant="primary" 
                  className="mt-auto"
                  onClick={() => navigate('/staff/tables')}
                >
                  Xem bàn
                </Button>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4} className="mb-4">
            <Card className="h-100">
              <Card.Body className="d-flex flex-column">
                <Card.Title>Đặt món</Card.Title>
                <Card.Text>
                  Chọn món ăn và đồ uống cho khách hàng
                </Card.Text>
                <Button 
                  variant="primary" 
                  className="mt-auto"
                  onClick={() => navigate('/staff/order')}
                >
                  Đặt món
                </Button>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4} className="mb-4">
            <Card className="h-100">
              <Card.Body className="d-flex flex-column">
                <Card.Title>Thanh toán</Card.Title>
                <Card.Text>
                  Xử lý thanh toán cho khách hàng
                </Card.Text>
                <Button 
                  variant="primary" 
                  className="mt-auto"
                  onClick={() => navigate('/staff/payment')}
                >
                  Thanh toán
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Dashboard; 