import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Modal, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

function TableManagement() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(''); // 'order' hoặc 'pay'
  const navigate = useNavigate();
  
  useEffect(() => {
    // Kiểm tra đăng nhập
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      navigate('/staff');
      return;
    }
    
    // Giả lập dữ liệu bàn (trong thực tế, bạn sẽ gọi API)
    const dummyTables = Array.from({ length: 16 }, (_, i) => ({
      id: i + 1,
      number: i + 1,
      capacity: 4,
      isAvailable: Math.random() > 0.5 // Ngẫu nhiên trạng thái bàn để demo
    }));
    
    setTables(dummyTables);
  }, [navigate]);
  
  const sidebarItems = [
    { name: 'Tổng quan', path: '/staff/dashboard', icon: 'bi-speedometer2' },
    { name: 'Quản lý Bàn', path: '/staff/tables', icon: 'bi-grid' },
    { name: 'Đặt món', path: '/staff/order', icon: 'bi-cart-plus' },
    { name: 'Thanh toán', path: '/staff/payment', icon: 'bi-credit-card' },
    { name: 'Lịch sử đơn hàng', path: '/staff/history', icon: 'bi-clock-history' },
  ];
  
  const handleTableClick = (table) => {
    setSelectedTable(table);
    if (table.isAvailable) {
      setModalAction('order');
    } else {
      setModalAction('options');
    }
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTable(null);
  };
  
  const handleTableAction = (action) => {
    if (action === 'order') {
      // Chuyển sang trang đặt món với ID bàn
      navigate(`/staff/order?tableId=${selectedTable.id}`);
    } else if (action === 'payment') {
      // Chuyển sang trang thanh toán với ID bàn
      navigate(`/staff/payment?tableId=${selectedTable.id}`);
    } else if (action === 'release') {
      // Giải phóng bàn (thay đổi trạng thái)
      const updatedTables = tables.map(t => 
        t.id === selectedTable.id ? { ...t, isAvailable: true } : t
      );
      setTables(updatedTables);
      handleCloseModal();
    }
  };
  
  return (
    <div className="d-flex">
      <Sidebar items={sidebarItems} userRole="staff" />
      
      <Container fluid className="ms-sm-auto px-md-4 py-4">
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Quản lý Bàn</h1>
        </div>
        
        <div className="table-container">
          {tables.map(table => (
            <div 
              key={table.id}
              className={`table-item ${table.isAvailable ? 'table-available' : 'table-occupied'}`}
              onClick={() => handleTableClick(table)}
            >
              <div>
                <h4>Bàn {table.number}</h4>
                <small>{table.capacity} người</small>
              </div>
            </div>
          ))}
        </div>
        
        {/* Modal tương tác với bàn */}
        <Modal show={showModal} onHide={handleCloseModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              {selectedTable && `Bàn ${selectedTable.number}`}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalAction === 'order' && (
              <>
                <p>Bàn này hiện đang trống. Bạn muốn đặt món cho bàn này?</p>
                <Form.Group className="mb-3">
                  <Form.Label>Số lượng khách</Form.Label>
                  <Form.Control type="number" min="1" defaultValue="1" />
                </Form.Group>
              </>
            )}
            
            {modalAction === 'options' && (
              <p>Bàn này đang có khách. Bạn muốn thực hiện thao tác nào?</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Đóng
            </Button>
            
            {modalAction === 'order' && (
              <Button variant="primary" onClick={() => handleTableAction('order')}>
                Đặt món
              </Button>
            )}
            
            {modalAction === 'options' && (
              <>
                <Button variant="primary" onClick={() => handleTableAction('order')}>
                  Thêm món
                </Button>
                <Button variant="success" onClick={() => handleTableAction('payment')}>
                  Thanh toán
                </Button>
                <Button variant="danger" onClick={() => handleTableAction('release')}>
                  Đặt lại bàn trống
                </Button>
              </>
            )}
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
}

export default TableManagement; 