import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

function PaymentPage() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [order, setOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Kiểm tra đăng nhập
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      navigate('/staff');
      return;
    }
    
    // Giả lập dữ liệu bàn đang sử dụng
    const dummyTables = Array.from({ length: 16 }, (_, i) => ({
      id: i + 1,
      number: i + 1,
      capacity: 4,
      isAvailable: Math.random() > 0.7, // Ngẫu nhiên bàn trống hoặc có khách
      orderId: Math.random() > 0.7 ? null : 100 + i // Ngẫu nhiên có đơn hàng hoặc không
    }));
    
    setTables(dummyTables.filter(table => !table.isAvailable));
  }, [navigate]);
  
  const sidebarItems = [
    { name: 'Tổng quan', path: '/staff/dashboard', icon: 'bi-speedometer2' },
    { name: 'Quản lý Bàn', path: '/staff/tables', icon: 'bi-grid' },
    { name: 'Đặt món', path: '/staff/order', icon: 'bi-cart-plus' },
    { name: 'Thanh toán', path: '/staff/payment', icon: 'bi-credit-card' },
    { name: 'Lịch sử đơn hàng', path: '/staff/history', icon: 'bi-clock-history' },
  ];
  
  const handleTableSelect = (table) => {
    setSelectedTable(table);
    
    // Giả lập dữ liệu đơn hàng cho bàn được chọn
    const dummyOrder = {
      id: table.orderId,
      tableNumber: table.number,
      items: [
        { id: 1, name: 'Cà phê đen', price: 25000, quantity: 2 },
        { id: 2, name: 'Bánh flan', price: 15000, quantity: 1 },
      ],
      total: 25000 * 2 + 15000,
      createdAt: new Date().toLocaleString()
    };
    
    setOrder(dummyOrder);
  };
  
  const handlePayment = () => {
    if (!selectedTable || !order) {
      alert('Vui lòng chọn bàn trước khi thanh toán');
      return;
    }
    
    // Trong thực tế, bạn sẽ gửi yêu cầu thanh toán đến API
    console.log('Thanh toán:', {
      orderId: order.id,
      tableId: selectedTable.id,
      amount: order.total,
      paymentMethod: paymentMethod
    });
    
    // Hiển thị thông báo thành công
    setPaymentSuccess(true);
    
    // Sau 3 giây, chuyển về trang quản lý bàn
    setTimeout(() => {
      navigate('/staff/tables');
    }, 3000);
  };
  
  return (
    <div className="d-flex">
      <Sidebar items={sidebarItems} userRole="staff" />
      
      <Container fluid className="ms-sm-auto px-md-4 py-4">
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Thanh toán</h1>
        </div>
        
        {paymentSuccess ? (
          <div className="alert alert-success">
            Thanh toán thành công! Đang chuyển hướng về trang quản lý bàn...
          </div>
        ) : (
          <Row>
            <Col md={4}>
              <Card className="mb-4">
                <Card.Header>Bàn đang sử dụng</Card.Header>
                <Card.Body>
                  <div className="table-container payment-tables">
                    {tables.length === 0 ? (
                      <p className="text-muted">Không có bàn nào đang sử dụng</p>
                    ) : (
                      tables.map(table => (
                        <div 
                          key={table.id}
                          className={`table-item table-occupied ${selectedTable && selectedTable.id === table.id ? 'table-selected' : ''}`}
                          onClick={() => handleTableSelect(table)}
                        >
                          <div>
                            <h4>Bàn {table.number}</h4>
                            <small>{table.capacity} người</small>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={8}>
              {selectedTable && order ? (
                <Card>
                  <Card.Header>
                    <h5>Chi tiết đơn hàng - Bàn {selectedTable.number}</h5>
                  </Card.Header>
                  <Card.Body>
                    <Table striped bordered>
                      <thead>
                        <tr>
                          <th>Món</th>
                          <th>Đơn giá</th>
                          <th>Số lượng</th>
                          <th>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map(item => (
                          <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.price.toLocaleString('vi-VN')} đ</td>
                            <td>{item.quantity}</td>
                            <td>{(item.price * item.quantity).toLocaleString('vi-VN')} đ</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th colSpan="3">Tổng cộng</th>
                          <th>{order.total.toLocaleString('vi-VN')} đ</th>
                        </tr>
                      </tfoot>
                    </Table>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Phương thức thanh toán</Form.Label>
                      <Form.Select 
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="cash">Tiền mặt</option>
                        <option value="card">Thẻ ngân hàng</option>
                        <option value="momo">Ví điện tử (MoMo)</option>
                      </Form.Select>
                    </Form.Group>
                    
                    <Button 
                      variant="success" 
                      size="lg" 
                      className="w-100"
                      onClick={handlePayment}
                    >
                      Thanh toán
                    </Button>
                  </Card.Body>
                </Card>
              ) : (
                <div className="text-center p-5 bg-light rounded">
                  <h4>Vui lòng chọn bàn để xem chi tiết đơn hàng</h4>
                </div>
              )}
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
}

export default PaymentPage; 