import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

// Đăng ký các thành phần cần thiết cho ChartJS
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

function ReportPage() {
  const [reportType, setReportType] = useState('revenue');
  const [timeRange, setTimeRange] = useState('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState({
    labels: [],
    datasets: []
  });
  const [tableData, setTableData] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    orderCount: 0,
    averageOrder: 0,
    mostPopularItem: '',
    mostRevenueHour: ''
  });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Kiểm tra đăng nhập
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      navigate('/admin');
      return;
    }
    
    // Set ngày mặc định cho report
    const today = new Date();
    const end = formatDate(today);
    let start;
    
    // Thiết lập khoảng thời gian mặc định dựa trên timeRange
    switch (timeRange) {
      case 'week':
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        start = formatDate(oneWeekAgo);
        break;
      case 'month':
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(today.getMonth() - 1);
        start = formatDate(oneMonthAgo);
        break;
      case 'year':
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        start = formatDate(oneYearAgo);
        break;
      default:
        const defaultStart = new Date(today);
        defaultStart.setDate(today.getDate() - 7);
        start = formatDate(defaultStart);
    }
    
    setStartDate(start);
    setEndDate(end);
    
    // Generate report
    generateReport(reportType, timeRange, start, end);
  }, [reportType, timeRange, navigate]);
  
  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  
  const generateReport = (type, range, start, end) => {
    // Giả lập dữ liệu báo cáo
    let labels = [];
    let data = [];
    let bgColors = [];
    
    // Tạo labels dựa trên khoảng thời gian
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (range === 'week' || range === 'custom' && (endDate - startDate) / (1000 * 60 * 60 * 24) <= 31) {
      // Hiển thị theo ngày nếu là tuần hoặc khoảng thời gian tùy chỉnh <= 31 ngày
      for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
        labels.push(day.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }));
        data.push(Math.floor(Math.random() * 5000000) + 500000);
        bgColors.push('rgba(54, 162, 235, 0.5)');
      }
    } else if (range === 'month' || range === 'custom' && (endDate - startDate) / (1000 * 60 * 60 * 24) <= 90) {
      // Hiển thị theo tuần nếu là tháng hoặc khoảng thời gian tùy chỉnh <= 90 ngày
      const weeks = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 7));
      for (let i = 0; i < weeks; i++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd > endDate) weekEnd.setDate(endDate.getDate());
        
        labels.push(`${weekStart.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - ${weekEnd.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`);
        data.push(Math.floor(Math.random() * 20000000) + 5000000);
        bgColors.push('rgba(75, 192, 192, 0.5)');
      }
    } else {
      // Hiển thị theo tháng nếu là năm hoặc khoảng thời gian tùy chỉnh > 90 ngày
      const months = [];
      for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
        const monthStart = (year === startDate.getFullYear()) ? startDate.getMonth() : 0;
        const monthEnd = (year === endDate.getFullYear()) ? endDate.getMonth() : 11;
        
        for (let month = monthStart; month <= monthEnd; month++) {
          months.push(new Date(year, month, 1));
        }
      }
      
      for (const month of months) {
        labels.push(month.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }));
        data.push(Math.floor(Math.random() * 80000000) + 20000000);
        bgColors.push('rgba(153, 102, 255, 0.5)');
      }
    }
    
    // Nếu là báo cáo sản phẩm, thay đổi labels và data
    if (type === 'products') {
      labels = ['Cà phê đen', 'Cà phê sữa', 'Cappuccino', 'Latte', 'Trà đào', 'Trà sữa', 'Bánh ngọt', 'Nước ép'];
      data = [
        Math.floor(Math.random() * 500) + 100,
        Math.floor(Math.random() * 500) + 200,
        Math.floor(Math.random() * 500) + 150,
        Math.floor(Math.random() * 500) + 120,
        Math.floor(Math.random() * 500) + 180,
        Math.floor(Math.random() * 500) + 220,
        Math.floor(Math.random() * 500) + 90,
        Math.floor(Math.random() * 500) + 110
      ];
      bgColors = [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(153, 102, 255, 0.5)',
        'rgba(255, 159, 64, 0.5)',
        'rgba(199, 199, 199, 0.5)',
        'rgba(83, 102, 255, 0.5)'
      ];
    }
    
    // Thiết lập dữ liệu cho biểu đồ
    let chartData = {
      labels: labels,
      datasets: [
        {
          label: type === 'revenue' ? 'Doanh thu (VNĐ)' : 'Số lượng bán',
          data: data,
          backgroundColor: bgColors,
          borderColor: bgColors.map(color => color.replace('0.5', '1')),
          borderWidth: 1
        }
      ]
    };
    
    // Tạo dữ liệu cho bảng
    const tableRows = [];
    for (let i = 0; i < labels.length; i++) {
      tableRows.push({
        id: i + 1,
        period: labels[i],
        value: data[i]
      });
    }
    
    // Tính tổng kết
    const totalRevenue = data.reduce((sum, curr) => sum + curr, 0);
    const orderCount = Math.floor(Math.random() * 1000) + 200;
    
    // Thiết lập dữ liệu báo cáo
    setReportData(chartData);
    setTableData(tableRows);
    setSummary({
      totalRevenue: totalRevenue,
      orderCount: orderCount,
      averageOrder: Math.round(totalRevenue / orderCount),
      mostPopularItem: 'Cà phê sữa',
      mostRevenueHour: '18:00 - 20:00'
    });
  };
  
  const handleCustomDateChange = () => {
    generateReport(reportType, 'custom', startDate, endDate);
  };
  
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
  
  return (
    <div className="d-flex">
      <Sidebar items={sidebarItems} userRole="admin" />
      
      <Container fluid className="ms-sm-auto px-md-4 py-4 main-content">
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Báo cáo thống kê</h1>
          <Button variant="success">Xuất Excel</Button>
        </div>
        
        <Card className="mb-4">
          <Card.Body>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Loại báo cáo</Form.Label>
                  <Form.Select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <option value="revenue">Doanh thu</option>
                    <option value="products">Sản phẩm bán chạy</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Khoảng thời gian</Form.Label>
                  <Form.Select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                  >
                    <option value="week">7 ngày qua</option>
                    <option value="month">30 ngày qua</option>
                    <option value="year">365 ngày qua</option>
                    <option value="custom">Tùy chỉnh</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              {timeRange === 'custom' && (
                <>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>Từ ngày</Form.Label>
                      <Form.Control 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>Đến ngày</Form.Label>
                      <Form.Control 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={2} className="d-flex align-items-end">
                    <Button 
                      variant="primary"
                      className="mb-3 w-100"
                      onClick={handleCustomDateChange}
                    >
                      Áp dụng
                    </Button>
                  </Col>
                </>
              )}
            </Row>
          </Card.Body>
        </Card>
        
        <Row className="mb-4">
          <Col md={3}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <h6 className="text-muted mb-2">Tổng doanh thu</h6>
                <h3 className="mb-0">{summary.totalRevenue.toLocaleString('vi-VN')} đ</h3>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={3}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <h6 className="text-muted mb-2">Số đơn hàng</h6>
                <h3 className="mb-0">{summary.orderCount}</h3>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={3}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <h6 className="text-muted mb-2">Giá trị trung bình</h6>
                <h3 className="mb-0">{summary.averageOrder.toLocaleString('vi-VN')} đ</h3>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={3}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <h6 className="text-muted mb-2">Sản phẩm bán chạy</h6>
                <h3 className="mb-0">{summary.mostPopularItem}</h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Row className="mb-4">
          <Col md={8}>
            <Card>
              <Card.Body>
                <h5 className="mb-4">
                  {reportType === 'revenue' 
                    ? 'Biểu đồ doanh thu' 
                    : 'Biểu đồ sản phẩm bán chạy'}
                </h5>
                {reportType === 'revenue' 
                  ? <Line data={reportData} options={{ responsive: true, maintainAspectRatio: false }} style={{ height: '400px' }} />
                  : <Bar data={reportData} options={{ responsive: true, maintainAspectRatio: false }} style={{ height: '400px' }} />
                }
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="h-100">
              <Card.Body>
                <h5 className="mb-4">Phân bố doanh thu</h5>
                <Pie data={{
                  labels: ['Buổi sáng', 'Buổi trưa', 'Buổi chiều', 'Buổi tối'],
                  datasets: [{
                    label: 'Doanh thu (VNĐ)',
                    data: [
                      Math.floor(Math.random() * 2000000) + 1000000,
                      Math.floor(Math.random() * 1500000) + 500000,
                      Math.floor(Math.random() * 3000000) + 2000000,
                      Math.floor(Math.random() * 3500000) + 2500000
                    ],
                    backgroundColor: [
                      'rgba(255, 99, 132, 0.5)',
                      'rgba(54, 162, 235, 0.5)',
                      'rgba(255, 206, 86, 0.5)',
                      'rgba(75, 192, 192, 0.5)'
                    ],
                    borderColor: [
                      'rgba(255, 99, 132, 1)',
                      'rgba(54, 162, 235, 1)',
                      'rgba(255, 206, 86, 1)',
                      'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                  }]
                }} />
                <div className="text-center mt-3">
                  <p><strong>Giờ cao điểm:</strong> {summary.mostRevenueHour}</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Card>
          <Card.Body>
            <h5 className="mb-4">
              {reportType === 'revenue' 
                ? 'Bảng doanh thu chi tiết' 
                : 'Bảng chi tiết sản phẩm bán chạy'}
            </h5>
            
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>
                    {reportType === 'revenue' 
                      ? 'Thời gian' 
                      : 'Sản phẩm'}
                  </th>
                  <th>
                    {reportType === 'revenue' 
                      ? 'Doanh thu (VNĐ)' 
                      : 'Số lượng bán'}
                  </th>
                  <th>Tỷ lệ (%)</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map(row => {
                  const percentage = ((row.value / summary.totalRevenue) * 100).toFixed(2);
                  return (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.period}</td>
                      <td>
                        {reportType === 'revenue' 
                          ? row.value.toLocaleString('vi-VN') + ' đ' 
                          : row.value}
                      </td>
                      <td>{percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan="2" className="text-end">Tổng cộng:</th>
                  <th>
                    {reportType === 'revenue' 
                      ? summary.totalRevenue.toLocaleString('vi-VN') + ' đ' 
                      : tableData.reduce((sum, row) => sum + row.value, 0)}
                  </th>
                  <th>100%</th>
                </tr>
              </tfoot>
            </Table>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default ReportPage; 