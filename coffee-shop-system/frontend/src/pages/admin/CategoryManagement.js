import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({ id: null, name: '' });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Kiểm tra đăng nhập
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      navigate('/admin');
      return;
    }
    
    // Giả lập dữ liệu danh mục
    const dummyCategories = [
      { id: 1, name: 'Cà phê', productCount: 12 },
      { id: 2, name: 'Trà', productCount: 8 },
      { id: 3, name: 'Bánh ngọt', productCount: 10 },
      { id: 4, name: 'Đồ ăn nhanh', productCount: 6 },
      { id: 5, name: 'Nước ép', productCount: 5 }
    ];
    
    setCategories(dummyCategories);
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
  
  const handleAddCategory = () => {
    // Trong thực tế, bạn sẽ gửi yêu cầu thêm danh mục đến API
    const newCategory = {
      id: categories.length + 1,
      name: currentCategory.name,
      productCount: 0
    };
    
    setCategories([...categories, newCategory]);
    setShowAddModal(false);
    setCurrentCategory({ id: null, name: '' });
  };
  
  const handleEditCategory = () => {
    // Trong thực tế, bạn sẽ gửi yêu cầu cập nhật danh mục đến API
    const updatedCategories = categories.map(cat => 
      cat.id === currentCategory.id ? { ...cat, name: currentCategory.name } : cat
    );
    
    setCategories(updatedCategories);
    setShowEditModal(false);
    setCurrentCategory({ id: null, name: '' });
  };
  
  const handleDeleteCategory = () => {
    // Trong thực tế, bạn sẽ gửi yêu cầu xóa danh mục đến API
    const updatedCategories = categories.filter(cat => cat.id !== currentCategory.id);
    
    setCategories(updatedCategories);
    setShowDeleteModal(false);
    setCurrentCategory({ id: null, name: '' });
  };
  
  return (
    <div className="d-flex">
      <Sidebar items={sidebarItems} userRole="admin" />
      
      <Container fluid className="ms-sm-auto px-md-4 py-4">
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Quản lý Danh mục</h1>
          <Button 
            variant="primary"
            onClick={() => {
              setCurrentCategory({ id: null, name: '' });
              setShowAddModal(true);
            }}
          >
            Thêm Danh mục
          </Button>
        </div>
        
        <Card>
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên danh mục</th>
                  <th>Số sản phẩm</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => (
                  <tr key={category.id}>
                    <td>{category.id}</td>
                    <td>{category.name}</td>
                    <td>{category.productCount}</td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        className="me-2"
                        onClick={() => {
                          setCurrentCategory({ id: category.id, name: category.name });
                          setShowEditModal(true);
                        }}
                      >
                        Sửa
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => {
                          setCurrentCategory({ id: category.id, name: category.name });
                          setShowDeleteModal(true);
                        }}
                        disabled={category.productCount > 0}
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
        
        {/* Modal Thêm Danh mục */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Thêm Danh mục</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Tên danh mục</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Nhập tên danh mục"
                  value={currentCategory.name}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
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
              onClick={handleAddCategory}
              disabled={!currentCategory.name.trim()}
            >
              Thêm
            </Button>
          </Modal.Footer>
        </Modal>
        
        {/* Modal Sửa Danh mục */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Sửa Danh mục</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Tên danh mục</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Nhập tên danh mục"
                  value={currentCategory.name}
                  onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
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
              onClick={handleEditCategory}
              disabled={!currentCategory.name.trim()}
            >
              Cập nhật
            </Button>
          </Modal.Footer>
        </Modal>
        
        {/* Modal Xóa Danh mục */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Xác nhận xóa</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Bạn có chắc chắn muốn xóa danh mục "{currentCategory.name}" không?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDeleteCategory}>
              Xóa
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
}

export default CategoryManagement; 