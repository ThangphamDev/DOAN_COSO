import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

function TableManagement() {
  const [tables, setTables] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentTable, setCurrentTable] = useState({
    id: null,
    number: '',
    capacity: 4,
    isAvailable: true
  });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Kiểm tra đăng nhập
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      navigate('/admin');
      return;
    }
    
    // Giả lập dữ liệu bàn
    const dummyTables = Array.from({ length: 16 }, (_, i) => ({
      id: i + 1,
      number: i + 1,
      capacity: 4,
      isAvailable: Math.random() > 0.3 // Ngẫu nhiên bàn trống hoặc có khách
    }));
    
    setTables(dummyTables);
  }, [navigate]);
  
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
  
  const handleAddTable = () => {
    // Trong thực tế, bạn sẽ gửi yêu cầu thêm bàn đến API
    const newTable = {
      id: tables.length + 1,
      number: parseInt(currentTable.number),
      capacity: parseInt(currentTable.capacity),
      isAvailable: true
    };
    
    setTables([...tables, newTable]);
    setShowAddModal(false);
    setCurrentTable({
      id: null,
      number: '',
      capacity: 4,
      isAvailable: true
    });
  };
  
  const handleEditTable = () => {
    // Trong thực tế, bạn sẽ gửi yêu cầu cập nhật bàn đến API
    const updatedTables = tables.map(table => 
      table.id === currentTable.id ? { 
        ...table, 
        capacity: parseInt(currentTable.capacity),
        isAvailable: currentTable.isAvailable
      } : table
    );
    
    setTables(updatedTables);
    setShowEditModal(false);
    setCurrentTable({
      id: null,
      number: '',
      capacity: 4,
      isAvailable: true
    });
  };
  
  const handleDeleteTable = () => {
    // Trong thực tế, bạn sẽ gửi yêu cầu xóa bàn đến API
    const updatedTables = tables.filter(table => table.id !== currentTable.id);
    
    setTables(updatedTables);
    setShowDeleteModal(false);
    setCurrentTable({
      id: null,
      number: '',
      capacity: 4,
      isAvailable: true
    });
  };
  
  return (
    <div className="d-flex">
      <Sidebar items={sidebarItems} userRole="admin" />
      
      <Container fluid className="ms-sm-auto px-md-4 py-4">
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Quản lý Bàn</h1>
          <Button 
            variant="primary"
            onClick={() => {
              setCurrentTable({
                id: null,
                number: tables.length + 1,
                capacity: 4,
                isAvailable: true
              });
              setShowAddModal(true);
            }}
          >
            Thêm Bàn
          </Button>
        </div>
        
        <Row>
          <div className="table-grid">
            {tables.map(table => (
              <div 
                key={table.id}
                className={`table-item ${table.isAvailable ? 'table-available' : 'table-occupied'}`}
              >
                <div className="table-content">
                  <h4>Bàn {table.number}</h4>
                  <p>{table.capacity} người</p>
                  <Badge bg={table.isAvailable ? 'success' : 'danger'}>
                    {table.isAvailable ? 'Trống' : 'Có khách'}
                  </Badge>
                  <div className="table-actions mt-2">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      className="me-2"
                      onClick={() => {
                        setCurrentTable({
                          id: table.id,
                          number: table.number,
                          capacity: table.capacity,
                          isAvailable: table.isAvailable
                        });
                        setShowEditModal(true);
                      }}
                    >
                      Sửa
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => {
                        setCurrentTable({
                          id: table.id,
                          number: table.number,
                          capacity: table.capacity,
                          isAvailable: table.isAvailable
                        });
                        setShowDeleteModal(true);
                      }}
                      disabled={!table.isAvailable}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Row>
        
        {/* Modal Thêm Bàn */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Thêm Bàn</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Số bàn</Form.Label>
                <Form.Control 
                  type="number" 
                  min="1"
                  placeholder="Nhập số bàn"
                  value={currentTable.number}
                  onChange={(e) => setCurrentTable({ ...currentTable, number: e.target.value })}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Sức chứa</Form.Label>
                <Form.Control 
                  type="number" 
                  min="1"
                  max="20"
                  placeholder="Nhập sức chứa"
                  value={currentTable.capacity}
                  onChange={(e) => setCurrentTable({ ...currentTable, capacity: e.target.value })}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Hủy
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAddTable}
              disabled={!currentTable.number || !currentTable.capacity}
            >
              Thêm
            </Button>
          </Modal.Footer>
        </Modal>
        
        {/* Modal Sửa Bàn */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Sửa Bàn</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Số bàn</Form.Label>
                <Form.Control 
                  type="number" 
                  value={currentTable.number}
                  disabled
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Sức chứa</Form.Label>
                <Form.Control 
                  type="number" 
                  min="1"
                  max="20"
                  placeholder="Nhập sức chứa"
                  value={currentTable.capacity}
                  onChange={(e) => setCurrentTable({ ...currentTable, capacity: e.target.value })}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Check 
                  type="checkbox"
                  id="isAvailable"
                  label="Bàn trống"
                  checked={currentTable.isAvailable}
                  onChange={(e) => setCurrentTable({ ...currentTable, isAvailable: e.target.checked })}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Hủy
            </Button>
            <Button 
              variant="primary" 
              onClick={handleEditTable}
              disabled={!currentTable.capacity}
            >
              Cập nhật
            </Button>
          </Modal.Footer>
        </Modal>
        
        {/* Modal Xóa Bàn */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Xác nhận xóa</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Bạn có chắc chắn muốn xóa Bàn {currentTable.number} không?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDeleteTable}>
              Xóa
            </Button>
          </Modal.Footer>
        </Modal>
        
        <style jsx="true">{`
          .table-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
            width: 100%;
            padding: 20px 0;
          }
          
          .table-item {
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            transition: all 0.3s ease;
          }
          
          .table-available {
            background-color: #d1e7dd;
            border: 1px solid #badbcc;
          }
          
          .table-occupied {
            background-color: #f8d7da;
            border: 1px solid #f5c2c7;
          }
          
          .table-content {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          
          .table-content h4 {
            margin-bottom: 5px;
          }
          
          .table-content p {
            margin-bottom: 10px;
          }
        `}</style>
      </Container>
    </div>
  );
}

export default TableManagement; 