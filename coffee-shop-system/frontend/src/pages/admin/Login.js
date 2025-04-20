import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }
    
    try {
      // Tạm thời sử dụng xác thực giả lập
      // Trong ứng dụng thực tế, bạn sẽ gọi API backend
      if (username === 'admin' && password === 'password') {
        localStorage.setItem('user', JSON.stringify({ 
          username, 
          role: 'admin',
          fullName: 'Quản Lý'
        }));
        navigate('/admin/dashboard');
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi đăng nhập');
      console.error(err);
    }
  };

  return (
    <Container className="login-container">
      <Card className="login-form">
        <Card.Body>
          <h2 className="text-center mb-4">Đăng Nhập Quản Lý</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Tên đăng nhập</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
              />
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Label>Mật khẩu</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
              />
            </Form.Group>
            
            <Button variant="primary" type="submit" className="w-100">
              Đăng Nhập
            </Button>
          </Form>
          
          <div className="text-center mt-3">
            <Button 
              variant="link" 
              onClick={() => navigate('/staff')}
            >
              Đăng nhập với tư cách nhân viên
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login; 