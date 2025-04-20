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
      // Kiểm tra nếu không phải admin thì chuyển hướng
      if (foundUser.role !== 'admin') {
        navigate('/admin');
      }
    } else {
      navigate('/admin');
    }
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/admin');
  };

  if (!user) return null;

  return (
    <div className="d-flex">
      <Sidebar items={sidebarItems} userRole="admin" />
      
      <Container fluid className="ms-sm-auto px-md-4 py-4 main-content">
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Tổng quan Hệ thống</h1>
          <Button variant="outline-secondary" onClick={handleLogout}>
            Đăng xuất
          </Button>
        </div>
        
        <Row className="mb-4">
          <Col md={3}>
            <Card className="dashboard-stats">
              <Card.Body>
                <h5>Doanh thu hôm nay</h5>
                <h2 className="text-primary">2.500.000 đ</h2>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={3}>
            <Card className="dashboard-stats">
              <Card.Body>
                <h5>Số đơn hàng</h5>
                <h2 className="text-success">42</h2>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={3}>
            <Card className="dashboard-stats">
              <Card.Body>
                <h5>Sản phẩm</h5>
                <h2 className="text-info">124</h2>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={3}>
            <Card className="dashboard-stats">
              <Card.Body>
                <h5>Bàn đang phục vụ</h5>
                <h2 className="text-warning">8/16</h2>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Row>
          <Col md={6} className="mb-4">
            <Card className="chart-container">
              <Card.Body>
                <h5 className="card-title">Doanh thu theo tuần</h5>
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p className="text-muted">Biểu đồ doanh thu sẽ hiển thị ở đây</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6} className="mb-4">
            <Card className="chart-container">
              <Card.Body>
                <h5 className="card-title">Sản phẩm bán chạy</h5>
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p className="text-muted">Biểu đồ sản phẩm bán chạy sẽ hiển thị ở đây</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Row>
          <Col md={12}>
            <Card>
              <Card.Body>
                <h5 className="card-title">Đơn hàng gần đây</h5>
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Bàn</th>
                      <th>Nhân viên</th>
                      <th>Thời gian</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td>Bàn 5</td>
                      <td>Nguyễn Văn A</td>
                      <td>15:30 15/04/2023</td>
                      <td>150.000 đ</td>
                      <td><span className="badge bg-success">Hoàn thành</span></td>
                    </tr>
                    <tr>
                      <td>2</td>
                      <td>Bàn 3</td>
                      <td>Trần Thị B</td>
                      <td>14:45 15/04/2023</td>
                      <td>220.000 đ</td>
                      <td><span className="badge bg-success">Hoàn thành</span></td>
                    </tr>
                    <tr>
                      <td>3</td>
                      <td>Bàn 7</td>
                      <td>Lê Văn C</td>
                      <td>13:20 15/04/2023</td>
                      <td>185.000 đ</td>
                      <td><span className="badge bg-success">Hoàn thành</span></td>
                    </tr>
                    <tr>
                      <td>4</td>
                      <td>Bàn 1</td>
                      <td>Phạm Thị D</td>
                      <td>12:10 15/04/2023</td>
                      <td>95.000 đ</td>
                      <td><span className="badge bg-success">Hoàn thành</span></td>
                    </tr>
                    <tr>
                      <td>5</td>
                      <td>Bàn 10</td>
                      <td>Vũ Văn E</td>
                      <td>11:30 15/04/2023</td>
                      <td>320.000 đ</td>
                      <td><span className="badge bg-success">Hoàn thành</span></td>
                    </tr>
                  </tbody>
                </table>
                <div className="text-end">
                  <Button 
                    variant="outline-primary" 
                    onClick={() => navigate('/admin/orders')}
                  >
                    Xem tất cả đơn hàng
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Dashboard; 