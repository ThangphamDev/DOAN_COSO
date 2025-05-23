/**
 * Table Manager Module - T2K Coffee Staff
 * Module quản lý bàn cho nhân viên, xử lý kết nối API và hiển thị dữ liệu bàn
 */

// Constants
const TABLE_API_URL = 'http://localhost:8081/api/tables';
const STATUS_CLASSES = {
    'Available': 'status-available',
    'Occupied': 'status-occupied',
    'Reserved': 'status-reserved',
    'Cleaning': 'status-cleaning'
};
const STATUS_TRANSLATIONS = {
    'Available': 'Trống',
    'Occupied': 'Đang phục vụ',
    'Reserved': 'Đặt trước',
    'Cleaning': 'Đang dọn dẹp'
};

// State variables
let tables = [];
let filteredTables = [];
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;
let currentTableId = null;

// DOM Elements
let tableList;
let tableStatsElements = {};
let tableSearchInput;
let statusFilterSelect;
let areaFilterSelect;
let addTableBtn;
let paginationElements = {};
let tableModal;
let deleteModal;
let statusModal;
let tableForm;
let statusForm;

// Khởi tạo khi trang tải xong
document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo tham chiếu đến các phần tử DOM
    initDOMReferences();

    // Thiết lập các sự kiện
    setupEventListeners();

    // Thiết lập modals
    setupModals();

    // Tải dữ liệu bàn từ API
    loadTables();
});

// Khởi tạo tham chiếu đến các phần tử DOM
function initDOMReferences() {
    // Bảng danh sách bàn
    tableList = document.querySelector('#tablesTable tbody');

    // Thống kê
    tableStatsElements.total = document.getElementById('total-tables');
    tableStatsElements.available = document.getElementById('available-tables');
    tableStatsElements.occupied = document.getElementById('occupied-tables');

    // Tìm kiếm và lọc
    tableSearchInput = document.getElementById('table-search');
    statusFilterSelect = document.getElementById('statusFilter');
    areaFilterSelect = document.getElementById('areaFilter');
    
    // Nút thêm bàn
    addTableBtn = document.getElementById('add-table-btn');

    // Modal và Form
    tableModal = document.getElementById('tableModal');
    deleteModal = document.getElementById('deleteTableModal');
    statusModal = document.getElementById('statusModal');
    tableForm = document.getElementById('tableForm');
    statusForm = document.getElementById('statusForm');

    // Phân trang
    paginationElements.prevBtn = document.getElementById('prevPage');
    paginationElements.nextBtn = document.getElementById('nextPage');
    paginationElements.currentPage = document.getElementById('currentPage');
    paginationElements.itemsPerPage = document.getElementById('itemsPerPage');
}

// Thiết lập các sự kiện
function setupEventListeners() {
    // Nút thêm bàn
    if (addTableBtn) {
        addTableBtn.addEventListener('click', openAddTableModal);
    }

    // Tìm kiếm
    if (tableSearchInput) {
        tableSearchInput.addEventListener('input', applyFilters);
    }

    // Lọc theo trạng thái và khu vực
    if (statusFilterSelect) {
        statusFilterSelect.addEventListener('change', applyFilters);
    }
    if (areaFilterSelect) {
        areaFilterSelect.addEventListener('change', applyFilters);
    }

    // Phân trang
    if (paginationElements.prevBtn) {
        paginationElements.prevBtn.addEventListener('click', goToPrevPage);
    }
    if (paginationElements.nextBtn) {
        paginationElements.nextBtn.addEventListener('click', goToNextPage);
    }
    if (paginationElements.itemsPerPage) {
        paginationElements.itemsPerPage.addEventListener('change', function() {
            itemsPerPage = parseInt(this.value);
            currentPage = 1;
            renderTables();
        });
    }

    // Form sự kiện Submit
    if (tableForm) {
        tableForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveTable();
        });
    }
    if (statusForm) {
        statusForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateTableStatus();
        });
    }

    // Xác nhận xóa
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            if (currentTableId) {
                deleteTable(currentTableId);
                closeModal(deleteModal);
            }
        });
    }
}

// Thiết lập các modal
function setupModals() {
    const closeBtns = document.querySelectorAll('.close, [data-close="modal"]');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });

    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    });
}

// Mở và đóng modal
function openModal(modal) {
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modal) {
    if (modal) {
        modal.style.display = 'none';
    }
}

// Tải dữ liệu bàn từ API
async function loadTables() {
    try {
        const response = await fetch(TABLE_API_URL);
        if (!response.ok) {
            throw new Error('Không thể tải dữ liệu bàn. Mã lỗi: ' + response.status);
        }
        const data = await response.json();
        tables = data.map(table => ({
            id: table.idTable,
            name: table.tableName,
            number: table.tableNumber,
            status: table.status,
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
    if (!tableList) return;
    tableList.innerHTML = '';
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredTables.length);
    totalPages = Math.ceil(filteredTables.length / itemsPerPage);

    if (filteredTables.length === 0) {
        tableList.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">Không tìm thấy bàn nào</td>
            </tr>
        `;
        updatePagination();
        return;
    }

    for (let i = startIndex; i < endIndex; i++) {
        const table = filteredTables[i];
        const row = createTableRow(table);
        tableList.appendChild(row);
    }
    updatePagination();
}

// Tạo dòng dữ liệu cho bàn
function createTableRow(table) {
    const row = document.createElement('tr');
    const statusClass = STATUS_CLASSES[table.status] || 'status-available';
    const statusText = STATUS_TRANSLATIONS[table.status] || table.status;

    row.innerHTML = `
        <td>${table.id}</td>
        <td>${table.name}</td>
        <td>${table.area}</td>
        <td>${table.capacity}</td>
        <td><span class="status ${statusClass}" style="cursor:pointer;" title="Nhấn để thay đổi trạng thái">${statusText}</span></td>
        <td>${table.notes || '—'}</td>
        <td>
            <button class="action-btn btn-edit" data-id="${table.id}" title="Chỉnh sửa"><i class="fa fa-edit"></i></button>
            <button class="action-btn btn-status" data-id="${table.id}" title="Thay đổi trạng thái"><i class="fa fa-sync"></i></button>
            <button class="action-btn btn-delete" data-id="${table.id}" title="Xóa"><i class="fa fa-trash"></i></button>
        </td>
    `;

    const statusBadge = row.querySelector('.status');
    if (statusBadge) {
        statusBadge.addEventListener('click', () => openStatusModal(table));
    }

    const editBtn = row.querySelector('.btn-edit');
    if (editBtn) {
        editBtn.addEventListener('click', () => openEditTableModal(table));
    }

    const statusBtn = row.querySelector('.btn-status');
    if (statusBtn) {
        statusBtn.addEventListener('click', () => openStatusModal(table));
    }

    const deleteBtn = row.querySelector('.btn-delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => confirmDeleteTable(table));
    }

    return row;
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

// Cập nhật phân trang
function updatePagination() {
    if (paginationElements.currentPage) {
        paginationElements.currentPage.textContent = `Trang ${currentPage} / ${totalPages || 1}`;
    }
    if (paginationElements.prevBtn) {
        paginationElements.prevBtn.disabled = currentPage <= 1;
    }
    if (paginationElements.nextBtn) {
        paginationElements.nextBtn.disabled = currentPage >= totalPages;
    }
}

// Chuyển trang
function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTables();
    }
}

function goToNextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        renderTables();
    }
}

// Áp dụng bộ lọc
function applyFilters() {
    const searchText = tableSearchInput ? tableSearchInput.value.toLowerCase() : '';
    const statusFilter = statusFilterSelect ? statusFilterSelect.value : 'all';
    const areaFilter = areaFilterSelect ? areaFilterSelect.value : 'all';

    filteredTables = tables.filter(table => {
        const matchesSearch = 
            table.name.toLowerCase().includes(searchText) || 
            table.area.toLowerCase().includes(searchText) ||
            (table.number && table.number.toString().includes(searchText));
        const matchesStatus = statusFilter === 'all' || table.status === statusFilter;
        const matchesArea = areaFilter === 'all' || table.area === areaFilter;
        return matchesSearch && matchesStatus && matchesArea;
    });

    currentPage = 1;
    renderTables();
}

// Mở modal thêm bàn mới
function openAddTableModal() {
    currentTableId = null;
    if (tableForm) tableForm.reset();
    const modalTitle = document.getElementById('modalTableTitle');
    if (modalTitle) modalTitle.innerHTML = '<i class="fa fa-chair"></i> Thêm bàn mới';
    const statusSelect = document.getElementById('tableStatus');
    if (statusSelect) statusSelect.value = 'Available';
    openModal(tableModal);
}

// Mở modal chỉnh sửa bàn
function openEditTableModal(table) {
    currentTableId = table.id;
    const modalTitle = document.getElementById('modalTableTitle');
    if (modalTitle) modalTitle.innerHTML = `<i class="fa fa-chair"></i> Chỉnh sửa ${table.name}`;
    document.getElementById('tableId').value = table.id;
    document.getElementById('tableName').value = table.name;
    document.getElementById('tableNumber').value = table.number;
    document.getElementById('tableCapacity').value = table.capacity;
    document.getElementById('tableArea').value = table.area;
    document.getElementById('tableStatus').value = table.status;
    document.getElementById('tableNotes').value = table.notes || '';
    openModal(tableModal);
}

// Mở modal thay đổi trạng thái
function openStatusModal(table) {
    currentTableId = table.id;
    document.getElementById('statusTableId').value = table.id;
    document.getElementById('newStatus').value = table.status;
    document.getElementById('statusNote').value = table.notes || '';
    openModal(statusModal);
}

// Xác nhận xóa bàn
function confirmDeleteTable(table) {
    currentTableId = table.id;
    const deleteTableName = document.getElementById('deleteTableName');
    if (deleteTableName) deleteTableName.textContent = table.name;
    openModal(deleteModal);
}

// Lưu bàn (thêm mới hoặc cập nhật)
async function saveTable() {
    try {
        const tableId = document.getElementById('tableId').value;
        const tableName = document.getElementById('tableName').value;
        const tableNumber = parseInt(document.getElementById('tableNumber').value);
        const tableCapacity = parseInt(document.getElementById('tableCapacity').value);
        const tableArea = document.getElementById('tableArea').value;
        const tableStatus = document.getElementById('tableStatus').value;
        const tableNotes = document.getElementById('tableNotes').value;

        const tableData = {
            tableName: tableName,
            tableNumber: tableNumber,
            capacity: tableCapacity,
            location: tableArea,
            status: tableStatus,
            notes: tableNotes
        };

        let response;
        let successMessage;

        if (currentTableId) {
            tableData.idTable = parseInt(currentTableId);
            response = await fetch(`${TABLE_API_URL}/${currentTableId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tableData)
            });
            successMessage = `Cập nhật bàn ${tableName} thành công`;
        } else {
            response = await fetch(TABLE_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tableData)
            });
            successMessage = `Thêm bàn mới ${tableName} thành công`;
        }

        if (!response.ok) {
            throw new Error(`Lỗi: ${response.status} - ${response.statusText}`);
        }

        closeModal(tableModal);
        await loadTables();
        alert(successMessage);
    } catch (error) {
        console.error('Lỗi khi lưu bàn:', error);
        alert(`Không thể lưu bàn: ${error.message}`);
    }
}

// Cập nhật trạng thái bàn
async function updateTableStatus() {
    try {
        const tableId = document.getElementById('statusTableId').value;
        const newStatus = document.getElementById('newStatus').value;
        const statusNote = document.getElementById('statusNote').value;

        const response = await fetch(`${TABLE_API_URL}/${tableId}/status?status=${newStatus}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Lỗi: ${response.status} - ${response.statusText}`);
        }

        closeModal(statusModal);
        await loadTables();
        alert('Cập nhật trạng thái thành công');
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái:', error);
        alert(`Không thể cập nhật trạng thái: ${error.message}`);
    }
}

// Xóa bàn
async function deleteTable(tableId) {
    try {
        const response = await fetch(`${TABLE_API_URL}/${tableId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Lỗi: ${response.status} - ${response.statusText}`);
        }

        tables = tables.filter(table => table.id != tableId);
        filteredTables = filteredTables.filter(table => table.id != tableId);
        updateTableStatistics();
        renderTables();
        alert('Đã xóa bàn thành công');
    } catch (error) {
        console.error('Lỗi khi xóa bàn:', error);
        alert(`Không thể xóa bàn: ${error.message}`);
    }
}