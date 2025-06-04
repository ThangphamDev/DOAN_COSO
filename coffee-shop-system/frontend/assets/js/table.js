
const TABLE_API_URL = 'http://localhost:8081/api/tables';
const STATUS_CLASSES = {
    'Available': 'available',
    'Occupied': 'occupied'
};
const STATUS_TRANSLATIONS = {
    'Available': 'Trống',
    'Occupied': 'Đang phục vụ'
};

function getAuthToken() {
    return localStorage.getItem('token');
}

function getAuthHeaders() {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

let tables = [];
let filteredTables = [];

let tablesGrid;
let tableStatsElements = {};
let tableSearchInput;
let areaFilterSelect;

document.addEventListener('DOMContentLoaded', function() {
    if (checkAuthentication()) {
        initDOMReferences();
        setupEventListeners();
        loadTables();
    }
});

function checkAuthentication() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || !role || !(role.toLowerCase().includes('staff') || role.toLowerCase().includes('admin'))) {
        window.location.href = '../auth/login.html';
        return false;
    }
    
    return true;
}

function initDOMReferences() {
    tablesGrid = document.getElementById('tablesGrid');
    tableStatsElements.total = document.getElementById('total-tables');
    tableStatsElements.available = document.getElementById('available-tables');
    tableStatsElements.occupied = document.getElementById('occupied-tables');
    tableSearchInput = document.getElementById('table-search');
    areaFilterSelect = document.getElementById('areaFilter');
}

// Tải dữ liệu bàn từ API
async function loadTables() {
    try {
        const token = getAuthToken();
        if (!token) {
            window.location.href = '../auth/login.html';
            return;
        }
        
        const response = await fetch(TABLE_API_URL, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Không thể tải dữ liệu bàn. Mã lỗi: ' + response.status);
        }
        const data = await response.json();
        tables = data.map(table => ({
            id: table.idTable,
            name: `Bàn ${table.tableNumber}`,
            number: table.tableNumber,
            status: table.status === 'Occupied' ? 'Occupied' : 'Available',
            capacity: table.capacity,
            area: table.location,
            notes: table.notes || ''
        }));
        filteredTables = [...tables];
        updateTableStatistics();
        renderTables();
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu bàn:', error);
        alert('Không thể tải dữ liệu bàn: ' + error.message);
        tables = [];
        filteredTables = [];
        updateTableStatistics();
        renderTables();
    }
}

// Hiển thị danh sách bàn
function renderTables() {
    if (!tablesGrid) return;
    tablesGrid.innerHTML = '';
    
    if (filteredTables.length === 0) {
        tablesGrid.innerHTML = '<div class="no-data">Không tìm thấy bàn nào</div>';
        return;
    }

    filteredTables.forEach(table => {
        const tableElement = createTableElement(table);
        tablesGrid.appendChild(tableElement);
    });
}

// Tạo phần tử HTML cho mỗi bàn
function createTableElement(table) {
    const div = document.createElement('div');
    div.className = `table-item ${table.status.toLowerCase()}`;
    div.onclick = () => toggleTableStatus(table);
    
    div.innerHTML = `
        <div class="table-status ${table.status.toLowerCase()}"></div>
        <div class="table-number">${table.name}</div>
        <div class="table-location">${table.area}</div>
        <div class="table-capacity">
            <i class="fas fa-user"></i>
            ${table.capacity}
        </div>
    `;
    
    return div;
}

// Cập nhật thống kê
function updateTableStatistics() {
    if (tableStatsElements.total) {
        tableStatsElements.total.textContent = tables.length;
    }
    if (tableStatsElements.available) {
        tableStatsElements.available.textContent = tables.filter(table => table.status === 'Available').length;
    }
    if (tableStatsElements.occupied) {
        tableStatsElements.occupied.textContent = tables.filter(table => table.status === 'Occupied').length;
    }
}

// Chuyển đổi trạng thái bàn
async function toggleTableStatus(table) {
    const token = getAuthToken();
    if (!token) {
        window.location.href = '../auth/login.html';
        return;
    }
    
    const newStatus = table.status === 'Available' ? 'Occupied' : 'Available';
    try {
        const tableData = {
            idTable: table.id,
            tableNumber: table.number,
            capacity: table.capacity,
            location: table.area,
            status: newStatus,
            description: table.notes || ''
        };
        
        const response = await fetch(`${TABLE_API_URL}/${table.id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(tableData)
        });

        if (!response.ok) {
            throw new Error(`Lỗi: ${response.status}`);
        }

        // Cập nhật trạng thái trong mảng tables và filteredTables
        const tableIndex = tables.findIndex(t => t.id === table.id);
        if (tableIndex !== -1) {
            tables[tableIndex].status = newStatus;
        }
        
        const filteredIndex = filteredTables.findIndex(t => t.id === table.id);
        if (filteredIndex !== -1) {
            filteredTables[filteredIndex].status = newStatus;
        }

        updateTableStatistics();
        renderTables();
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái:', error);
        alert('Không thể cập nhật trạng thái bàn: ' + error.message);
    }
}

// Áp dụng bộ lọc
function applyFilters() {
    const searchText = tableSearchInput ? tableSearchInput.value.toLowerCase() : '';
    const areaFilter = areaFilterSelect ? areaFilterSelect.value : 'all';

    filteredTables = tables.filter(table => {
        const matchesSearch = 
            table.name.toLowerCase().includes(searchText) || 
            table.area.toLowerCase().includes(searchText) ||
            (table.number && table.number.toString().includes(searchText));
        const matchesArea = areaFilter === 'all' || table.area === areaFilter;
        return matchesSearch && matchesArea;
    });

    renderTables();
}

// Thiết lập các sự kiện
function setupEventListeners() {
    if (tableSearchInput) {
        tableSearchInput.addEventListener('input', applyFilters);
    }
    if (areaFilterSelect) {
        areaFilterSelect.addEventListener('change', applyFilters);
    }
}