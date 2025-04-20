import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Modal, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

function PromotionManagement() {
  const [promotions, setPromotions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState({
    id: null,
    code: '',
    name: '',
    discountType: 'percent',
    discountValue: '',
    startDate: '',
    endDate: '',
    isActive: true
  });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Kiểm tra đăng nhập
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      navigate('/admin');
      return;
    }
    
    // Lấy ngày hiện tại để so sánh với thời gian kết thúc của khuyến mãi
    const today = new Date();
    
    // Giả lập dữ liệu khuyến mãi
    const dummyPromotions = [
      {
        id: 1,
        code: 'SUMMER2023',
        name: 'Khuyến mãi hè 2023',
        discountType: 'percent',
        discountValue: 10,
        startDate: '2023-06-01',
        endDate: '2023-08-31',
        isActive: new Date('2023-08-31') >= today
      },
      {
        id: 2,
        code: 'WELCOME',
        name: 'Chào mừng khách hàng mới',
        discountType: 'amount',
        discountValue: 20000,
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        isActive: new Date('2023-12-31') >= today
      },
      {
        id: 3,
        code: 'BIRTHDAY',
        name: 'Sinh nhật cửa hàng',
        discountType: 'percent',
        discountValue: 20,
        startDate: '2023-10-10',
        endDate: '2023-10-15',
        isActive: new Date('2023-10-15') >= today
      }
    ];
    
    setPromotions(dummyPromotions);
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
  
  const formatDiscountValue = (promotion) => {
    if (promotion.discountType === 'percent') {
      return `${promotion.discountValue}%`;
    } else {
      return `${promotion.discountValue.toLocaleString('vi-VN')} đ`;
    }
  };
  
  const handleAddPromotion = () => {
    // Trong thực tế, bạn sẽ gửi yêu cầu thêm khuyến mãi đến API
    const newPromotion = {
      id: promotions.length + 1,
      code: currentPromotion.code.toUpperCase(),
      name: currentPromotion.name,
      discountType: currentPromotion.discountType,
      discountValue: parseFloat(currentPromotion.discountValue),
      startDate: currentPromotion.startDate,
      endDate: currentPromotion.endDate,
      isActive: new Date(currentPromotion.endDate) >= new Date()
    };
    
    setPromotions([...promotions, newPromotion]);
    setShowAddModal(false);
    setCurrentPromotion({
      id: null,
      code: '',
      name: '',
      discountType: 'percent',
      discountValue: '',
      startDate: '',
      endDate: '',
      isActive: true
    });
  };
  
  const handleEditPromotion = () => {
    // Trong thực tế, bạn sẽ gửi yêu cầu cập nhật khuyến mãi đến API
    const updatedPromotions = promotions.map(promo => 
      promo.id === currentPromotion.id ? {
        ...promo,
        name: currentPromotion.name,
        discountType: currentPromotion.discountType,
        discountValue: parseFloat(currentPromotion.discountValue),
        startDate: currentPromotion.startDate,
        endDate: currentPromotion.endDate,
        isActive: new Date(currentPromotion.endDate) >= new Date() && currentPromotion.isActive
      } : promo
    );
    
    setPromotions(updatedPromotions);
    setShowEditModal(false);
    setCurrentPromotion({
      id: null,
      code: '',
      name: '',
      discountType: 'percent',
      discountValue: '',
      startDate: '',
      endDate: '',
      isActive: true
    });
  };
  
  const handleDeletePromotion = () => {
    // Trong thực tế, bạn sẽ gửi yêu cầu xóa khuyến mãi đến API
    const updatedPromotions = promotions.filter(promo => promo.id !== currentPromotion.id);
    
    setPromotions(updatedPromotions);
    setShowDeleteModal(false);
    setCurrentPromotion({
      id: null,
      code: '',
      name: '',
      discountType: 'percent',
      discountValue: '',
      startDate: '',
      endDate: '',
      isActive: true
    });
  };
  
  const togglePromotionStatus = (id) => {
    // Trong thực tế, bạn sẽ gửi yêu cầu cập nhật trạng thái khuyến mãi đến API
    const updatedPromotions = promotions.map(promo => 
      promo.id === id ? { ...promo, isActive: !promo.isActive } : promo
    );
    
    setPromotions(updatedPromotions);
  };
  
  return (
    <div className="d-flex">
      <Sidebar items={sidebarItems} userRole="admin" />
      
      <Container fluid className="ms-sm-auto px-md-4 py-4">
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Quản lý Khuyến mãi</h1>
          <Button 
            variant="primary"
            onClick={() => {
              setCurrentPromotion({
                id: null,
                code: '',
                name: '',
                discountType: 'percent',
                discountValue: '',
                startDate: '',
                endDate: '',
                isActive: true
              });
              setShowAddModal(true);
            }}
          >
            Thêm Khuyến mãi
          </Button>
        </div>
        
        <Card>
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên khuyến mãi</th>
                  <th>Giảm giá</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày kết thúc</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map(promotion => (
                  <tr key={promotion.id}>
                    <td>{promotion.code}</td>
                    <td>{promotion.name}</td>
                    <td>{formatDiscountValue(promotion)}</td>
                    <td>{new Date(promotion.startDate).toLocaleDateString('vi-VN')}</td>
                    <td>{new Date(promotion.endDate).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <Badge 
                        bg={promotion.isActive ? 'success' : 'danger'}
                        onClick={() => togglePromotionStatus(promotion.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {promotion.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                      </Badge>
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        className="me-2"
                        onClick={() => {
                          setCurrentPromotion({
                            id: promotion.id,
                            code: promotion.code,
                            name: promotion.name,
                            discountType: promotion.discountType,
                            discountValue: promotion.discountValue,
                            startDate: promotion.startDate,
                            endDate: promotion.endDate,
                            isActive: promotion.isActive
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
                          setCurrentPromotion({
                            id: promotion.id,
                            code: promotion.code,
                            name: promotion.name
                          });
                          setShowDeleteModal(true);
                        }}
                      >
                        Xóa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
        
        {/* Modal Thêm Khuyến mãi */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Thêm Khuyến mãi</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Mã khuyến mãi</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Nhập mã khuyến mãi"
                  value={currentPromotion.code}
                  onChange={(e) => setCurrentPromotion({ ...currentPromotion, code: e.target.value })}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Tên khuyến mãi</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Nhập tên khuyến mãi"
                  value={currentPromotion.name}
                  onChange={(e) => setCurrentPromotion({ ...currentPromotion, name: e.target.value })}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Loại giảm giá</Form.Label>
                <Form.Select
                  value={currentPromotion.discountType}
                  onChange={(e) => setCurrentPromotion({ ...currentPromotion, discountType: e.target.value })}
                >
                  <option value="percent">Phần trăm (%)</option>
                  <option value="amount">Số tiền (VNĐ)</option>
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Giá trị giảm giá</Form.Label>
                <Form.Control 
                  type="number" 
                  min="0"
                  max={currentPromotion.discountType === 'percent' ? 100 : null}
                  placeholder={currentPromotion.discountType === 'percent' ? 'Nhập phần trăm giảm giá' : 'Nhập số tiền giảm giá'}
                  value={currentPromotion.discountValue}
                  onChange={(e) => setCurrentPromotion({ ...currentPromotion, discountValue: e.target.value })}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Ngày bắt đầu</Form.Label>
                <Form.Control 
                  type="date" 
                  value={currentPromotion.startDate}
                  onChange={(e) => setCurrentPromotion({ ...currentPromotion, startDate: e.target.value })}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Ngày kết thúc</Form.Label>
                <Form.Control 
                  type="date" 
                  value={currentPromotion.endDate}
                  onChange={(e) => setCurrentPromotion({ ...currentPromotion, endDate: e.target.value })}
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
              onClick={handleAddPromotion}
              disabled={
                !currentPromotion.code.trim() || 
                !currentPromotion.name.trim() || 
                !currentPromotion.discountValue || 
                !currentPromotion.startDate || 
                !currentPromotion.endDate
              }
            >
              Thêm
            </Button>
          </Modal.Footer>
        </Modal>
        
        {/* Modal Sửa Khuyến mãi */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Sửa Khuyến mãi</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Mã khuyến mãi</Form.Label>
                <Form.Control 
                  type="text" 
                  value={currentPromotion.code}
                  disabled
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Tên khuyến mãi</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Nhập tên khuyến mãi"
                  value={currentPromotion.name}
                  onChange={(e) => setCurrentPromotion({ ...currentPromotion, name: e.target.value })}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Loại giảm giá</Form.Label>
                <Form.Select
                  value={currentPromotion.discountType}
                  onChange={(e) => setCurrentPromotion({ ...currentPromotion, discountType: e.target.value })}
                >
                  <option value="percent">Phần trăm (%)</option>
                  <option value="amount">Số tiền (VNĐ)</option>
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Giá trị giảm giá</Form.Label>
                <Form.Control 
                  type="number" 
                  min="0"
                  max={currentPromotion.discountType === 'percent' ? 100 : null}
                  placeholder={currentPromotion.discountType === 'percent' ? 'Nhập phần trăm giảm giá' : 'Nhập số tiền giảm giá'}
                  value={currentPromotion.discountValue}
                  onChange={(e) => setCurrentPromotion({ ...currentPromotion, discountValue: e.target.value })}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Ngày bắt đầu</Form.Label>
                <Form.Control 
                  type="date" 
                  value={currentPromotion.startDate}
                  onChange={(e) => setCurrentPromotion({ ...currentPromotion, startDate: e.target.value })}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Ngày kết thúc</Form.Label>
                <Form.Control 
                  type="date" 
                  value={currentPromotion.endDate}
                  onChange={(e) => setCurrentPromotion({ ...currentPromotion, endDate: e.target.value })}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Check 
                  type="switch"
                  id="isActive"
                  label="Hoạt động"
                  checked={currentPromotion.isActive}
                  onChange={(e) => setCurrentPromotion({ ...currentPromotion, isActive: e.target.checked })}
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
              onClick={handleEditPromotion}
              disabled={
                !currentPromotion.name.trim() || 
                !currentPromotion.discountValue || 
                !currentPromotion.startDate || 
                !currentPromotion.endDate
              }
            >
              Cập nhật
            </Button>
          </Modal.Footer>
        </Modal>
        
        {/* Modal Xóa Khuyến mãi */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Xác nhận xóa</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Bạn có chắc chắn muốn xóa khuyến mãi "{currentPromotion.name}" với mã "{currentPromotion.code}" không?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDeletePromotion}>
              Xóa
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
}

export default PromotionManagement; 