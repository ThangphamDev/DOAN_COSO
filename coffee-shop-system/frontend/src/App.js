import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './assets/css/App.css';

// Staff Pages
import StaffLogin from './pages/staff/Login';
import StaffDashboard from './pages/staff/Dashboard';
import TableManagement from './pages/staff/TableManagement';
import OrderPage from './pages/staff/OrderPage';
import PaymentPage from './pages/staff/PaymentPage';
import OrderHistory from './pages/staff/OrderHistory';

// Admin Pages
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import ProductManagement from './pages/admin/ProductManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import AccountManagement from './pages/admin/AccountManagement';
import AdminTableManagement from './pages/admin/TableManagement';
import PromotionManagement from './pages/admin/PromotionManagement';
import OrderManagement from './pages/admin/OrderManagement';
import ReportPage from './pages/admin/ReportPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Staff Routes */}
          <Route path="/staff" element={<StaffLogin />} />
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
          <Route path="/staff/tables" element={<TableManagement />} />
          <Route path="/staff/order" element={<OrderPage />} />
          <Route path="/staff/payment" element={<PaymentPage />} />
          <Route path="/staff/history" element={<OrderHistory />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<ProductManagement />} />
          <Route path="/admin/categories" element={<CategoryManagement />} />
          <Route path="/admin/accounts" element={<AccountManagement />} />
          <Route path="/admin/tables" element={<AdminTableManagement />} />
          <Route path="/admin/promotions" element={<PromotionManagement />} />
          <Route path="/admin/orders" element={<OrderManagement />} />
          <Route path="/admin/reports" element={<ReportPage />} />
          
          {/* Default Route */}
          <Route path="/" element={<StaffLogin />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 