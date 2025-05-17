
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

// DOM Elements - Khai báo các phần tử DOM sẽ sử dụng
let tableList;
let tableStatsElements = {};
let tableSearchInput;
let statusFilterSelect;
let areaFilterSelect;
let addTableBtn;
let paginationElements = {};
let tableModal;
let deleteModal;
let tableForm;

// Khởi tạo module khi trang đã tải xong
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
    tableList = document.getElementById('table-list');

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
    tableForm = document.getElementById('tableForm');

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
        tableSearchInput.addEventListener('input', function() {
            applyFilters();
        });
    }

    // Lọc theo trạng thái
    if (statusFilterSelect) {
        statusFilterSelect.addEventListener('change', function() {
            applyFilters();
        });
    }

    // Lọc theo khu vực
    if (areaFilterSelect) {
        areaFilterSelect.addEventListener('change', function() {
            applyFilters();
        });
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

    // Form Sự kiện Submit
    if (tableForm) {
        tableForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveTable();
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
    // Thêm sự kiện đóng modal cho tất cả nút đóng
    const closeBtns = document.querySelectorAll('.close-btn, [data-close="modal"]');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });

    // Đóng modal khi click bên ngoài
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    });
}

// Mở modal
function openModal(modal) {
    if (modal) {
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
    }
}

// Đóng modal
function closeModal(modal) {
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
}

// Tải dữ liệu bàn từ API
async function loadTables() {
    try {
        // Hiển thị loader nếu có
        if (window.AdminCore && window.AdminCore.showLoader) {
            window.AdminCore.showLoader(true);
        }

        // Gọi API tables
        const response = await fetch(TABLE_API_URL);
        
        // Kiểm tra phản hồi
        if (!response.ok) {
            throw new Error('Không thể tải dữ liệu bàn. Mã lỗi: ' + response.status);
        }
        
        // Đọc dữ liệu JSON
        const data = await response.json();
        
        // Chuyển đổi định dạng dữ liệu để phù hợp với hiển thị
        tables = data.map(table => ({
            id: table.idTable,
            name: `Bàn ${table.tableNumber}`,
            number: table.tableNumber,
            status: table.status,
            capacity: table.capacity,
            area: table.location,
            notes: table.description || ''
        }));
        
        // Cập nhật danh sách đã lọc
        filteredTables = [...tables];
        
        // Cập nhật giao diện người dùng
        updateTableStatistics();
        renderTables();
        
        // Hiển thị thông báo thành công nếu có
        if (window.AdminCore && window.AdminCore.showNotification) {
            window.AdminCore.showNotification('Đã tải dữ liệu bàn thành công', 'success');
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu bàn:', error);
        
        // Hiển thị thông báo lỗi nếu có
        if (window.AdminCore && window.AdminCore.showNotification) {
            window.AdminCore.showNotification('Không thể tải dữ liệu bàn: ' + error.message, 'error');
        }
        
        // Reset tables to empty arrays
        tables = [];
        filteredTables = [];
        
        // Cập nhật giao diện
        updateTableStatistics();
        renderTables();
    } finally {
        // Ẩn loader nếu có
        if (window.AdminCore && window.AdminCore.showLoader) {
            window.AdminCore.showLoader(false);
        }
    }
}

// Hiển thị danh sách bàn dựa trên bộ lọc và phân trang
function renderTables() {
    if (!tableList) return;
    
    // Xóa dữ liệu hiện tại
    tableList.innerHTML = '';
    
    // Tính toán phân trang
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredTables.length);
    totalPages = Math.ceil(filteredTables.length / itemsPerPage);
    
    // Hiển thị thông báo nếu không có dữ liệu
    if (filteredTables.length === 0) {
        tableList.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">Không tìm thấy bàn nào</td>
            </tr>
        `;
        
        updatePagination();
        return;
    }
    
    // Hiển thị dữ liệu bàn
    for (let i = startIndex; i < endIndex; i++) {
        const table = filteredTables[i];
        const row = createTableRow(table);
        tableList.appendChild(row);
    }
    
    // Cập nhật phân trang
    updatePagination();
}

// Tạo dòng dữ liệu cho bàn
function createTableRow(table) {
    const row = document.createElement('tr');
    
    // Lấy các thông tin hiển thị
    const statusClass = STATUS_CLASSES[table.status] || 'status-available';
    const statusText = STATUS_TRANSLATIONS[table.status] || table.status;
    
    row.innerHTML = `
        <td>${table.number}</td>
        <td>${table.name}</td>
        <td>${table.area}</td>
        <td>${table.capacity} người</td>
        <td><span class="status-badge ${statusClass} status-toggle" style="cursor:pointer;" title="Nhấn để chuyển trạng thái">${statusText}</span></td>
        <td>${table.notes || '—'}</td>
        <td class="actions">
            <button class="btn-icon edit-btn" data-id="${table.id}" title="Chỉnh sửa"><i class="fas fa-edit"></i></button>
            <button class="btn-icon delete-btn" data-id="${table.id}" title="Xóa"><i class="fas fa-trash"></i></button>
        </td>
    `;
    
    // Thêm sự kiện cho badge trạng thái
    const statusBadge = row.querySelector('.status-toggle');
    if (statusBadge) {
        statusBadge.addEventListener('click', async () => {
            // Chỉ cho phép chuyển giữa Available và Occupied
            let newStatus = table.status === 'Available' ? 'Occupied' : 'Available';
            try {
                // Hiển thị loader nếu có
                if (window.AdminCore && window.AdminCore.showLoader) {
                    window.AdminCore.showLoader(true);
                }
                // Gọi API cập nhật trạng thái
                const tableData = {
                    tableNumber: table.number,
                    capacity: table.capacity,
                    location: table.area,
                    status: newStatus,
                    description: table.notes || '',
                    idTable: table.id
                };
                const response = await fetch(`${TABLE_API_URL}/${table.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(tableData)
                });
                if (!response.ok) {
                    throw new Error(`Lỗi: ${response.status} - ${response.statusText}`);
                }
                // Cập nhật lại dữ liệu trên client
                table.status = newStatus;
                // Cập nhật lại giao diện
                await loadTables();
                if (window.AdminCore && window.AdminCore.showNotification) {
                    window.AdminCore.showNotification(`Đã chuyển trạng thái bàn ${table.name} sang ${STATUS_TRANSLATIONS[newStatus]}`, 'success');
                }
            } catch (error) {
                if (window.AdminCore && window.AdminCore.showNotification) {
                    window.AdminCore.showNotification(`Không thể cập nhật trạng thái: ${error.message}`, 'error');
                }
            } finally {
                if (window.AdminCore && window.AdminCore.showLoader) {
                    window.AdminCore.showLoader(false);
                }
            }
        });
    }
    
    // Thêm sự kiện cho nút chỉnh sửa
    const editBtn = row.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => openEditTableModal(table));
    }
    
    // Thêm sự kiện cho nút xóa
    const deleteBtn = row.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => confirmDeleteTable(table));
    }
    
    return row;
}

// Cập nhật thống kê về bàn
function updateTableStatistics() {
    // Tổng số bàn
    if (tableStatsElements.total) {
        tableStatsElements.total.textContent = tables.length;
    }
    
    // Số bàn trống
    if (tableStatsElements.available) {
        const availableCount = tables.filter(table => 
            table.status === 'Available').length;
        tableStatsElements.available.textContent = availableCount;
    }
    
    // Số bàn đang phục vụ
    if (tableStatsElements.occupied) {
        const occupiedCount = tables.filter(table => 
            table.status === 'Occupied').length;
        tableStatsElements.occupied.textContent = occupiedCount;
    }
}

// Cập nhật hiển thị phân trang
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

// Chuyển đến trang trước
function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTables();
    }
}

// Chuyển đến trang sau
function goToNextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        renderTables();
    }
}

// Áp dụng bộ lọc
function applyFilters() {
    // Lấy giá trị tìm kiếm
    const searchText = tableSearchInput ? tableSearchInput.value.toLowerCase() : '';
    
    // Lấy trạng thái lọc
    const statusFilter = statusFilterSelect ? statusFilterSelect.value : 'all';
    
    // Lấy khu vực lọc
    const areaFilter = areaFilterSelect ? areaFilterSelect.value : 'all';
    
    // Lọc dữ liệu
    filteredTables = tables.filter(table => {
        // Lọc theo tìm kiếm
        const matchesSearch = 
            table.name.toLowerCase().includes(searchText) || 
            table.area.toLowerCase().includes(searchText) ||
            (table.number && table.number.toString().includes(searchText));
        
        // Lọc theo trạng thái
        const matchesStatus = statusFilter === 'all' || 
            table.status === statusFilter;
        
        // Lọc theo khu vực
        const matchesArea = areaFilter === 'all' || 
            table.area === areaFilter;
        
        // Kết hợp các điều kiện
        return matchesSearch && matchesStatus && matchesArea;
    });
    
    // Cập nhật lại trang hiện tại và hiển thị
    currentPage = 1;
    renderTables();
}

// Mở modal thêm bàn mới
function openAddTableModal() {
    // Reset form
    currentTableId = null;
    if (tableForm) tableForm.reset();
    
    // Cập nhật tiêu đề
    const modalTitle = document.getElementById('modalTableTitle');
    if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-chair"></i> Thêm bàn mới';
    
    // Đặt trạng thái mặc định
    const statusSelect = document.getElementById('tableStatus');
    if (statusSelect) statusSelect.value = 'Available';
    
    // Mở modal
    openModal(tableModal);
}

// Mở modal chỉnh sửa bàn
function openEditTableModal(table) {
    // Lưu ID bàn hiện tại
    currentTableId = table.id;
    
    // Cập nhật tiêu đề
    const modalTitle = document.getElementById('modalTableTitle');
    if (modalTitle) modalTitle.innerHTML = `<i class="fas fa-chair"></i> Chỉnh sửa ${table.name}`;
    
    // Điền thông tin bàn vào form
    document.getElementById('tableId').value = table.id;
    document.getElementById('tableName').value = table.name;
    document.getElementById('tableNumber').value = table.number;
    document.getElementById('tableCapacity').value = table.capacity;
    document.getElementById('tableArea').value = table.area;
    document.getElementById('tableStatus').value = table.status;
    document.getElementById('tableNotes').value = table.notes || '';
    
    // Mở modal
    openModal(tableModal);
}

// Xác nhận xóa bàn
function confirmDeleteTable(table) {
    // Lưu ID bàn hiện tại
    currentTableId = table.id;
    
    // Hiển thị tên bàn trong modal xác nhận
    const deleteTableName = document.getElementById('deleteTableName');
    if (deleteTableName) deleteTableName.textContent = table.name;
    
    // Mở modal xác nhận
    openModal(deleteModal);
}

// Lưu bàn (thêm mới hoặc cập nhật)
async function saveTable() {
    try {
        // Hiển thị loader
        if (window.AdminCore && window.AdminCore.showLoader) {
            window.AdminCore.showLoader(true);
        }
        
        // Lấy dữ liệu từ form
        const tableId = document.getElementById('tableId').value;
        const tableName = document.getElementById('tableName').value;
        const tableNumber = parseInt(document.getElementById('tableNumber').value);
        const tableCapacity = parseInt(document.getElementById('tableCapacity').value);
        const tableArea = document.getElementById('tableArea').value;
        const tableStatus = document.getElementById('tableStatus').value;
        const tableNotes = document.getElementById('tableNotes').value;
        
        // Tạo đối tượng dữ liệu để gửi lên API
        const tableData = {
            tableNumber: tableNumber,
            capacity: tableCapacity,
            location: tableArea,
            status: tableStatus,
            description: tableNotes
        };
        
        let response;
        let successMessage;
        
        // Xác định nếu là thêm mới hay cập nhật
        if (currentTableId) {
            // Cập nhật bàn hiện có
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
            // Thêm bàn mới
            response = await fetch(TABLE_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tableData)
            });
            successMessage = `Thêm bàn mới ${tableName} thành công`;
        }
        
        // Kiểm tra phản hồi
        if (!response.ok) {
            throw new Error(`Lỗi: ${response.status} - ${response.statusText}`);
        }
        
        // Đóng modal
        closeModal(tableModal);
        
        // Tải lại dữ liệu
        await loadTables();
        
        // Thông báo thành công
        if (window.AdminCore && window.AdminCore.showNotification) {
            window.AdminCore.showNotification(successMessage, 'success');
        }
    } catch (error) {
        console.error('Lỗi khi lưu bàn:', error);
        
        // Thông báo lỗi
        if (window.AdminCore && window.AdminCore.showNotification) {
            window.AdminCore.showNotification(`Không thể lưu bàn: ${error.message}`, 'error');
        }
    } finally {
        // Ẩn loader
        if (window.AdminCore && window.AdminCore.showLoader) {
            window.AdminCore.showLoader(false);
        }
    }
}

// Xóa bàn
async function deleteTable(tableId) {
    try {
        // Hiển thị loader
        if (window.AdminCore && window.AdminCore.showLoader) {
            window.AdminCore.showLoader(true);
        }
        
        // Gọi API xóa bàn
        const response = await fetch(`${TABLE_API_URL}/${tableId}`, {
            method: 'DELETE'
        });
        
        // Kiểm tra phản hồi
        if (!response.ok) {
            throw new Error(`Lỗi: ${response.status} - ${response.statusText}`);
        }
        
        // Xóa bàn khỏi danh sách
        tables = tables.filter(table => table.id != tableId);
        filteredTables = filteredTables.filter(table => table.id != tableId);
        
        // Cập nhật giao diện
        updateTableStatistics();
        renderTables();
        
        // Thông báo thành công
        if (window.AdminCore && window.AdminCore.showNotification) {
            window.AdminCore.showNotification('Đã xóa bàn thành công', 'success');
        }
    } catch (error) {
        console.error('Lỗi khi xóa bàn:', error);
        
        // Thông báo lỗi
        if (window.AdminCore && window.AdminCore.showNotification) {
            window.AdminCore.showNotification(`Không thể xóa bàn: ${error.message}`, 'error');
        }
    } finally {
        // Ẩn loader
        if (window.AdminCore && window.AdminCore.showLoader) {
            window.AdminCore.showLoader(false);
        }
    }
}

// Export các hàm cần thiết nếu muốn sử dụng từ file khác
window.TableManager = {
    loadTables,
    renderTables,
    updateTableStatistics,
    openAddTableModal,
    openEditTableModal,
    confirmDeleteTable
}; 