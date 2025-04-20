import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

function AccountManagement() {
  const [accounts, setAccounts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentAccount, setCurrentAccount] = useState({
    id: null,
    username: '',
    fullName: '',
    role: 'staff',
    email: '',
    password: ''
  });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Kiểm tra đăng nhập
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      navigate('/admin');
      return;
    }
    
    // Giả lập dữ liệu tài khoản
    const dummyAccounts = [
      { id: 1, username: 'admin', fullName: 'Administrator', role: 'admin', email: 'admin@coffee.com' },
      { id: 2, username: 'staff1', fullName: 'Nguyễn Văn A', role: 'staff', email: 'staffa@coffee.com' },
      { id: 3, username: 'staff2', fullName: 'Trần Thị B', role: 'staff', email: 'staffb@coffee.com' },
      { id: 4, username: 'manager', fullName: 'Lê Quản Lý', role: 'admin', email: 'manager@coffee.com' }
    ];
    
    setAccounts(dummyAccounts);
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
  
  const handleAddAccount = () => {
    // Trong thực tế, bạn sẽ gửi yêu cầu thêm tài khoản đến API
    const newAccount = {
      id: accounts.length + 1,
      username: currentAccount.username,
      fullName: currentAccount.fullName,
      role: currentAccount.role,
      email: currentAccount.email
    };
    
    setAccounts([...accounts, newAccount]);
    setShowAddModal(false);
    setCurrentAccount({
      id: null,
      username: '',
      fullName: '',
      role: 'staff',
      email: '',
      password: ''
    });
  };
  
  const handleEditAccount = () => {
    // Trong thực tế, bạn sẽ gửi yêu cầu cập nhật tài khoản đến API
    const updatedAccounts = accounts.map(acc => 
      acc.id === currentAccount.id ? { 
        ...acc, 
        fullName: currentAccount.fullName,
        role: currentAccount.role,
        email: currentAccount.email
      } : acc
    );
    
    setAccounts(updatedAccounts);
    setShowEditModal(false);
    setCurrentAccount({
      id: null,
      username: '',
      fullName: '',
      role: 'staff',
      email: '',
      password: ''
    });
  };
  
  const handleDeleteAccount = () => {
    // Trong thực tế, bạn sẽ gửi yêu cầu xóa tài khoản đến API
    const updatedAccounts = accounts.filter(acc => acc.id !== currentAccount.id);
    
    setAccounts(updatedAccounts);
    setShowDeleteModal(false);
    setCurrentAccount({
      id: null,
      username: '',
      fullName: '',
      role: 'staff',
      email: '',
      password: ''
    });
  };
  
  return (
    <div className="d-flex">
      <Sidebar items={sidebarItems} userRole="admin" />
      
      <Container fluid className="ms-sm-auto px-md-4 py-4 main-content">
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Quản lý Tài khoản</h1>
          <Button 
            variant="primary"
            onClick={() => {
              setCurrentAccount({
                id: null,
                username: '',
                fullName: '',
                role: 'staff',
                email: '',
                password: ''
              });
              setShowAddModal(true);
            }}
          >
            Thêm Tài khoản
          </Button>
        </div>
        
        <Card>
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên đăng nhập</th>
                  <th>Họ tên</th>
                  <th>Vai trò</th>
                  <th>Email</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(account => (
                  <tr key={account.id}>
                    <td>{account.id}</td>
                    <td>{account.username}</td>
                    <td>{account.fullName}</td>
                    <td>
                      <span className={`badge ${account.role === 'admin' ? 'bg-danger' : 'bg-success'}`}>
                        {account.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
                      </span>
                    </td>
                    <td>{account.email}</td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        className="me-2"
                        onClick={() => {
                          setCurrentAccount({
                            id: account.id,
                            username: account.username,
                            fullName: account.fullName,
                            role: account.role,
                            email: account.email,
                            password: ''
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
                          setCurrentAccount({
                            id: account.id,
                            username: account.username,
                            fullName: account.fullName,
                            role: account.role,
                            email: account.email
                          });
                          setShowDeleteModal(true);
                        }}
                        disabled={account.username === 'admin'}
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
        
        {/* Modal Thêm Tài khoản */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Thêm Tài khoản</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Tên đăng nhập</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Nhập tên đăng nhập"
                  value={currentAccount.username}
                  onChange={(e) => setCurrentAccount({ ...currentAccount, username: e.target.value })}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Họ tên</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Nhập họ tên"
                  value={currentAccount.fullName}
                  onChange={(e) => setCurrentAccount({ ...currentAccount, fullName: e.target.value })}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control 
                  type="email" 
                  placeholder="Nhập email"
                  value={currentAccount.email}
                  onChange={(e) => setCurrentAccount({ ...currentAccount, email: e.target.value })}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Mật khẩu</Form.Label>
                <Form.Control 
                  type="password" 
                  placeholder="Nhập mật khẩu"
                  value={currentAccount.password}
                  onChange={(e) => setCurrentAccount({ ...currentAccount, password: e.target.value })}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Vai trò</Form.Label>
                <Form.Select
                  value={currentAccount.role}
                  onChange={(e) => setCurrentAccount({ ...currentAccount, role: e.target.value })}
                >
                  <option value="staff">Nhân viên</option>
                  <option value="admin">Quản trị viên</option>
                </Form.Select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Hủy
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAddAccount}
              disabled={!currentAccount.username.trim() || !currentAccount.fullName.trim() || !currentAccount.email.trim() || !currentAccount.password.trim()}
            >
              Thêm
            </Button>
          </Modal.Footer>
        </Modal>
        
        {/* Modal Sửa Tài khoản */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Sửa Tài khoản</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Tên đăng nhập</Form.Label>
                <Form.Control 
                  type="text" 
                  value={currentAccount.username}
                  disabled
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Họ tên</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Nhập họ tên"
                  value={currentAccount.fullName}
                  onChange={(e) => setCurrentAccount({ ...currentAccount, fullName: e.target.value })}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control 
                  type="email" 
                  placeholder="Nhập email"
                  value={currentAccount.email}
                  onChange={(e) => setCurrentAccount({ ...currentAccount, email: e.target.value })}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Mật khẩu</Form.Label>
                <Form.Control 
                  type="password" 
                  placeholder="Để trống nếu không muốn thay đổi"
                  value={currentAccount.password}
                  onChange={(e) => setCurrentAccount({ ...currentAccount, password: e.target.value })}
                />
                <Form.Text className="text-muted">
                  Để trống nếu không muốn thay đổi mật khẩu
                </Form.Text>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Vai trò</Form.Label>
                <Form.Select
                  value={currentAccount.role}
                  onChange={(e) => setCurrentAccount({ ...currentAccount, role: e.target.value })}
                  disabled={currentAccount.username === 'admin'}
                >
                  <option value="staff">Nhân viên</option>
                  <option value="admin">Quản trị viên</option>
                </Form.Select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Hủy
            </Button>
            <Button 
              variant="primary" 
              onClick={handleEditAccount}
              disabled={!currentAccount.fullName.trim() || !currentAccount.email.trim()}
            >
              Cập nhật
            </Button>
          </Modal.Footer>
        </Modal>
        
        {/* Modal Xóa Tài khoản */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Xác nhận xóa</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Bạn có chắc chắn muốn xóa tài khoản "{currentAccount.username}" không?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDeleteAccount}>
              Xóa
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
}

export default AccountManagement; 