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
    
let tables = [];
let filteredTables = [];
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;
let currentTableId = null;

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

document.addEventListener('DOMContentLoaded', function() {
    initDOMReferences();

    setupEventListeners();

    setupModals();

    loadTables();
});

function initDOMReferences() {
    tableList = document.getElementById('table-list');

    tableStatsElements.total = document.getElementById('total-tables');
    tableStatsElements.available = document.getElementById('available-tables');
    tableStatsElements.occupied = document.getElementById('occupied-tables');

    tableSearchInput = document.getElementById('table-search');
    statusFilterSelect = document.getElementById('statusFilter');
    areaFilterSelect = document.getElementById('areaFilter');
    
    addTableBtn = document.getElementById('add-table-btn');

    tableModal = document.getElementById('tableModal');
    deleteModal = document.getElementById('deleteTableModal');
    tableForm = document.getElementById('tableForm');

    paginationElements.prevBtn = document.getElementById('prevPage');
    paginationElements.nextBtn = document.getElementById('nextPage');
    paginationElements.currentPage = document.getElementById('currentPage');
    paginationElements.itemsPerPage = document.getElementById('itemsPerPage');
}

function setupEventListeners() {
    if (addTableBtn) {
        addTableBtn.addEventListener('click', openAddTableModal);
    }

    if (tableSearchInput) {
        tableSearchInput.addEventListener('input', function() {
            applyFilters();
        });
    }

    if (statusFilterSelect) {
        statusFilterSelect.addEventListener('change', function() {
            applyFilters();
        });
    }

    if (areaFilterSelect) {
        areaFilterSelect.addEventListener('change', function() {
            applyFilters();
        });
    }

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

    if (tableForm) {
        tableForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveTable();
        });
    }

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

function setupModals() {
    const closeBtns = document.querySelectorAll('.close-btn, [data-close="modal"]');
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

function openModal(modal) {
    if (modal) {
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
    }
}

function closeModal(modal) {
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
}

async function loadTables() {
    try {
        if (window.AdminCore && window.AdminCore.showLoader) {
            window.AdminCore.showLoader(true);
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
            status: table.status,
            capacity: table.capacity,
            area: table.location,
            notes: table.description || ''
        }));
        
        filteredTables = [...tables];
        
        updateTableStatistics();
        renderTables();
        
        if (window.AdminCore && window.AdminCore.showNotification) {
            window.AdminCore.showNotification('Đã tải dữ liệu bàn thành công', 'success');
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu bàn:', error);
        
        if (window.AdminCore && window.AdminCore.showNotification) {
            window.AdminCore.showNotification('Không thể tải dữ liệu bàn: ' + error.message, 'error');
        }
        
        tables = [];
        filteredTables = [];
        
        updateTableStatistics();
        renderTables();
    } finally {
        if (window.AdminCore && window.AdminCore.showLoader) {
            window.AdminCore.showLoader(false);
        }
    }
}

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

function createTableRow(table) {
    const row = document.createElement('tr');
    
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
    
    const statusBadge = row.querySelector('.status-toggle');
    if (statusBadge) {
        statusBadge.addEventListener('click', async () => {
            let newStatus = table.status === 'Available' ? 'Occupied' : 'Available';
            try {
                if (window.AdminCore && window.AdminCore.showLoader) {
                    window.AdminCore.showLoader(true);
                }
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
                    headers: getAuthHeaders(),
                    body: JSON.stringify(tableData)
                });
                if (!response.ok) {
                    throw new Error(`Lỗi: ${response.status} - ${response.statusText}`);
                }
                table.status = newStatus;
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
    
    const editBtn = row.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => openEditTableModal(table));
    }
    
    const deleteBtn = row.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => confirmDeleteTable(table));
    }
    
    return row;
}

function updateTableStatistics() {
    if (tableStatsElements.total) {
        tableStatsElements.total.textContent = tables.length;
    }
    
    if (tableStatsElements.available) {
        const availableCount = tables.filter(table => 
            table.status === 'Available').length;
        tableStatsElements.available.textContent = availableCount;
    }
    
    if (tableStatsElements.occupied) {
        const occupiedCount = tables.filter(table => 
            table.status === 'Occupied').length;
        tableStatsElements.occupied.textContent = occupiedCount;
    }
}

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

function applyFilters() {
    const searchText = tableSearchInput ? tableSearchInput.value.toLowerCase() : '';
    
    const statusFilter = statusFilterSelect ? statusFilterSelect.value : 'all';
    
    const areaFilter = areaFilterSelect ? areaFilterSelect.value : 'all';
    
    filteredTables = tables.filter(table => {
        const matchesSearch = 
            table.name.toLowerCase().includes(searchText) || 
            table.area.toLowerCase().includes(searchText) ||
            (table.number && table.number.toString().includes(searchText));
        
        const matchesStatus = statusFilter === 'all' || 
            table.status === statusFilter;
        
        const matchesArea = areaFilter === 'all' || 
            table.area === areaFilter;
        
        return matchesSearch && matchesStatus && matchesArea;
    });
    
    currentPage = 1;
    renderTables();
}

function openAddTableModal() {
    currentTableId = null;
    if (tableForm) tableForm.reset();
    
    const modalTitle = document.getElementById('modalTableTitle');
    if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-chair"></i> Thêm bàn mới';
    
    const statusSelect = document.getElementById('tableStatus');
    if (statusSelect) statusSelect.value = 'Available';
    
    openModal(tableModal);
}

function openEditTableModal(table) {
    currentTableId = table.id;
    
    const modalTitle = document.getElementById('modalTableTitle');
    if (modalTitle) modalTitle.innerHTML = `<i class="fas fa-chair"></i> Chỉnh sửa ${table.name}`;
    
    document.getElementById('tableId').value = table.id;
    document.getElementById('tableName').value = table.name;
    document.getElementById('tableNumber').value = table.number;
    document.getElementById('tableCapacity').value = table.capacity;
    document.getElementById('tableArea').value = table.area;
    document.getElementById('tableStatus').value = table.status;
    document.getElementById('tableNotes').value = table.notes || '';
    
    openModal(tableModal);
}

function confirmDeleteTable(table) {
    currentTableId = table.id;
    
    const deleteTableName = document.getElementById('deleteTableName');
    if (deleteTableName) deleteTableName.textContent = table.name;
    
    openModal(deleteModal);
}

async function saveTable() {
    try {
        if (window.AdminCore && window.AdminCore.showLoader) {
            window.AdminCore.showLoader(true, 'Đang lưu thông tin bàn...');
        }
        
        const tableData = {
            tableNumber: document.getElementById('tableNumber').value,
            capacity: parseInt(document.getElementById('tableCapacity').value),
            location: document.getElementById('tableArea').value,
            status: document.getElementById('tableStatus').value,
            description: document.getElementById('tableNotes').value
        };
        
        if (!tableData.tableNumber || isNaN(tableData.capacity) || !tableData.location) {
            throw new Error('Vui lòng điền đầy đủ thông tin bàn');
        }
        
        const currentTableId = document.getElementById('tableId').value;
        
        let response;
        if (currentTableId) {
            tableData.idTable = currentTableId;
            response = await fetch(`${TABLE_API_URL}/${currentTableId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(tableData)
            });
        } else {
            response = await fetch(TABLE_API_URL, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(tableData)
            });
        }
        
        if (!response.ok) {
            throw new Error(`Lỗi: ${response.status} - ${response.statusText}`);
        }
        
        closeModal(tableModal);
        await loadTables();
        
        if (window.AdminCore && window.AdminCore.showNotification) {
            window.AdminCore.showNotification(
                currentTableId ? 'Cập nhật bàn thành công' : 'Thêm bàn mới thành công', 
                'success'
            );
        }
    } catch (error) {
        console.error('Lỗi khi lưu bàn:', error);
        
        if (window.AdminCore && window.AdminCore.showNotification) {
            window.AdminCore.showNotification(`Lỗi: ${error.message}`, 'error');
        }
    } finally {
        if (window.AdminCore && window.AdminCore.showLoader) {
            window.AdminCore.showLoader(false);
        }
    }
}

async function deleteTable(tableId) {
    try {
        if (window.AdminCore && window.AdminCore.showLoader) {
            window.AdminCore.showLoader(true, 'Đang xóa bàn...');
        }
        
        const response = await fetch(`${TABLE_API_URL}/${tableId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Lỗi: ${response.status} - ${response.statusText}`);
        }
        
        await loadTables();
        
        if (window.AdminCore && window.AdminCore.showNotification) {
            window.AdminCore.showNotification('Xóa bàn thành công', 'success');
        }
    } catch (error) {
        console.error('Lỗi khi xóa bàn:', error);
        
        if (window.AdminCore && window.AdminCore.showNotification) {
            window.AdminCore.showNotification(`Lỗi: ${error.message}`, 'error');
        }
    } finally {
        if (window.AdminCore && window.AdminCore.showLoader) {
            window.AdminCore.showLoader(false);
        }
    }
}

window.TableManager = {
    loadTables,
    renderTables,
    updateTableStatistics,
    openAddTableModal,
    openEditTableModal,
    confirmDeleteTable
}; 