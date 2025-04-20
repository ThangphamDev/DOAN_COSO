import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Nav } from 'react-bootstrap';

function Sidebar({ items, userRole }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  // Lưu trạng thái collapsed vào localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      setCollapsed(savedState === 'true');
    }
  }, []);
  
  // Lưu trạng thái khi thay đổi và cập nhật tất cả container
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed);
    
    // Cập nhật class cho tất cả container
    const mainContainers = document.querySelectorAll('.ms-sm-auto');
    mainContainers.forEach(container => {
      // Thêm lớp main-content nếu chưa có
      if (!container.classList.contains('main-content')) {
        container.classList.add('main-content');
      }
      
      // Thêm hoặc xóa lớp main-content-expanded tùy theo trạng thái
      if (collapsed) {
        container.classList.add('main-content-expanded');
      } else {
        container.classList.remove('main-content-expanded');
      }
    });
  }, [collapsed]);
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
      </button>
      
      <div className={`sidebar bg-dark ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-sticky pt-3">
          <div className="px-3 pb-4 text-white">
            <h5>{collapsed ? (userRole === 'admin' ? 'QL' : 'NV') : (userRole === 'admin' ? 'Quản Lý' : 'Nhân Viên')}</h5>
          </div>
          <Nav className="flex-column">
            {items.map((item, index) => (
              <Nav.Item key={index}>
                <Nav.Link
                  as={Link}
                  to={item.path}
                  className={`text-white ${location.pathname === item.path ? 'active' : ''}`}
                  title={item.name}
                >
                  {item.icon && <i className={`bi ${item.icon} me-2`}></i>}
                  {!collapsed && item.name}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </div>
      </div>
    </>
  );
}

export default Sidebar; 