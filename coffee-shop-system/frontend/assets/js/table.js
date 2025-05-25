/**
 * Table Management Module - T2K Coffee Staff
 * Module quản lý bàn cho nhân viên
 */

// Constants
const API_BASE_URL = 'http://localhost:8081/api';
const ENDPOINTS = {
    TABLES: `${API_BASE_URL}/tables`,
    TABLE_STATUS: `${API_BASE_URL}/tables/status`
};

// State
let tables = [];
let currentPage = 1;
let itemsPerPage = 10;
let totalItems = 0;

// DOM Elements
let tableGrid;
let searchInput;
let statusFilter;
let areaFilter;
let tableStats;
let paginationControls;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initDOMReferences();
    setupEventListeners();
    loadInitialData();
});

// Initialize DOM element references
function initDOMReferences() {
    tableGrid = document.querySelector('.tables-grid');
    searchInput = document.getElementById('table-search');
    statusFilter = document.getElementById('statusFilter');
    areaFilter = document.getElementById('areaFilter');
    tableStats = {
        total: document.getElementById('total-tables'),
        available: document.getElementById('available-tables'),
        occupied: document.getElementById('occupied-tables')
    };
    paginationControls = {
        prev: document.getElementById('prevPage'),
        next: document.getElementById('nextPage'),
        current: document.getElementById('currentPage'),
        itemsPerPage: document.getElementById('itemsPerPage')
    };
}

// Setup event listeners
function setupEventListeners() {
    // Search
    document.querySelector('.search-btn').addEventListener('click', applyFilters);
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') applyFilters();
    });

    // Filters
    statusFilter.addEventListener('change', applyFilters);
    areaFilter.addEventListener('change', applyFilters);

    // Pagination
    paginationControls.prev.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadTables();
        }
    });
    paginationControls.next.addEventListener('click', () => {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            loadTables();
        }
    });
    paginationControls.itemsPerPage.addEventListener('change', () => {
        itemsPerPage = parseInt(paginationControls.itemsPerPage.value);
        currentPage = 1;
        loadTables();
    });

    // Modal events
    document.querySelectorAll('.close, [data-close="modal"]').forEach(element => {
        element.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
}

// Load initial data
async function loadInitialData() {
    try {
        await loadTables();
    } catch (error) {
        console.error('Error loading initial data:', error);
        showNotification('Không thể tải dữ liệu. Vui lòng thử lại sau.', 'error');
    }
}

// Load tables from API
async function loadTables() {
    try {
        const queryParams = new URLSearchParams({
            page: currentPage,
            limit: itemsPerPage,
            status: statusFilter.value,
            area: areaFilter.value,
            search: searchInput.value
        });

        const response = await fetch(`${ENDPOINTS.TABLES}?${queryParams}`);
        if (!response.ok) throw new Error('Failed to load tables');
        
        const data = await response.json();
        tables = data.tables;
        totalItems = data.total;
        
        renderTables();
        updateTableStatistics();
        updatePagination();
    } catch (error) {
        console.error('Error loading tables:', error);
        showNotification('Không thể tải danh sách bàn.', 'error');
    }
}

// Render tables to grid
function renderTables() {
    tableGrid.innerHTML = '';
    tables.forEach(table => {
        tableGrid.appendChild(createTableElement(table));
    });
}

// Create table element
function createTableElement(table) {
    const element = document.createElement('div');
    element.className = `table-item ${table.status.toLowerCase()}`;
    element.innerHTML = `
        <div class="table-number">${table.number}</div>
        <div class="table-location">${table.area}</div>
        <div class="table-status ${table.status.toLowerCase()}">${table.status}</div>
        <div class="table-capacity">
            <i class="fas fa-user"></i>
            <span>${table.capacity}</span>
        </div>
        <div class="table-actions">
            <button class="action-btn" onclick="editTable('${table.id}')">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn btn-danger" onclick="confirmDelete('${table.id}', '${table.number}')">
                <i class="fas fa-trash"></i>
            </button>
            <button class="action-btn" onclick="toggleTableStatus('${table.id}')">
                <i class="fas fa-exchange-alt"></i>
            </button>
        </div>
    `;
    return element;
}

// Update table statistics
function updateTableStatistics() {
    const stats = {
        total: tables.length,
        available: tables.filter(t => t.status.toLowerCase() === 'available').length,
        occupied: tables.filter(t => t.status.toLowerCase() === 'occupied').length
    };
    
    tableStats.total.textContent = stats.total;
    tableStats.available.textContent = stats.available;
    tableStats.occupied.textContent = stats.occupied;
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    paginationControls.current.textContent = `Trang ${currentPage} / ${totalPages}`;
    paginationControls.prev.disabled = currentPage === 1;
    paginationControls.next.disabled = currentPage === totalPages;
}

// Toggle table status
async function toggleTableStatus(tableId) {
    try {
        const table = tables.find(t => t.id === tableId);
        if (!table) throw new Error('Table not found');

        const newStatus = table.status.toLowerCase() === 'available' ? 'OCCUPIED' : 'AVAILABLE';
        
        const response = await fetch(`${ENDPOINTS.TABLE_STATUS}/${tableId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: newStatus
            })
        });

        if (!response.ok) throw new Error('Failed to update table status');
        
        await loadTables();
        showNotification('Cập nhật trạng thái bàn thành công.', 'success');
    } catch (error) {
        console.error('Error toggling table status:', error);
        showNotification('Không thể cập nhật trạng thái bàn.', 'error');
    }
}

// Apply filters
function applyFilters() {
    currentPage = 1;
    loadTables();
}

// Show notification
function showNotification(message, type = 'info') {
    // Implementation of notification system
    console.log(`${type.toUpperCase()}: ${message}`);
}

// Export functions for global access
window.editTable = function(id) {
    // Implementation of edit table
    console.log('Edit table:', id);
};

window.confirmDelete = function(id, number) {
    // Implementation of delete confirmation
    console.log('Confirm delete table:', id, number);
};

window.toggleTableStatus = toggleTableStatus;
