$(document).ready(function() {
    let currentPage = 1;
    let itemsPerPage = 10;
    let totalItems = 0;

    // Load tất cả dữ liệu
    function loadTables() {
        $.getJSON('/api/tables?page=' + currentPage + '&limit=' + itemsPerPage, function(data) {
            displayTables(data.tables);
            updatePagination(data.total);
            updateStats(data.stats);
        });
    }

    // Hiển thị danh sách bàn
    function displayTables(tables) {
        const tbody = $('#tablesTable tbody');
        tbody.empty();
        tables.forEach(table => {
            tbody.append(`
                <tr>
                    <td>${table.number}</td>
                    <td>${table.name}</td>
                    <td>${table.area}</td>
                    <td>${table.capacity}</td>
                    <td>${table.status}</td>
                    <td>${table.notes || '-'}</td>
                    <td>
                        <button class="action-btn" onclick="editTable('${table.id}')">Sửa</button>
                        <button class="action-btn btn-danger" onclick="confirmDelete('${table.id}', '${table.name}')">Xóa</button>
                        <button class="action-btn" onclick="changeStatus('${table.id}')">Thay đổi trạng thái</button>
                    </td>
                </tr>
            `);
        });
    }

    // Cập nhật thống kê
    function updateStats(stats) {
        $('#total-tables').text(stats.total || 0);
        $('#available-tables').text(stats.available || 0);
        $('#occupied-tables').text(stats.occupied || 0);
    }

    // Cập nhật phân trang
    function updatePagination(total) {
        totalItems = total;
        const totalPages = Math.ceil(total / itemsPerPage);
        $('#currentPage').text(`Trang ${currentPage} / ${totalPages}`);
        $('#prevPage').prop('disabled', currentPage === 1);
        $('#nextPage').prop('disabled', currentPage === totalPages);
    }

    // Tìm kiếm bàn
    $('.search-box .search-btn').click(function() {
        const query = $('#table-search').val().toLowerCase();
        $.getJSON('/api/tables/search?q=' + query + '&limit=' + itemsPerPage, function(data) {
            displayTables(data.tables);
            updatePagination(data.total);
        });
    });

    // Lọc bàn
    window.filterTables = function() {
        const status = $('#statusFilter').val();
        const area = $('#areaFilter').val();
        $.getJSON('/api/tables/filter?status=' + status + '&area=' + area + '&limit=' + itemsPerPage, function(data) {
            displayTables(data.tables);
            updatePagination(data.total);
        });
    };

    // Thay đổi số mục trên trang
    window.changeItemsPerPage = function() {
        itemsPerPage = $('#itemsPerPage').val();
        currentPage = 1;
        loadTables();
    };

    // Phân trang
    $('#prevPage').click(function() {
        if (currentPage > 1) {
            currentPage--;
            loadTables();
        }
    });
    $('#nextPage').click(function() {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            loadTables();
        }
    });

    // Thêm bàn
    $('#add-table-btn').click(function() {
        $('#tableId').val('');
        $('#modalTableTitle').text('Thêm bàn mới');
        $('#tableForm')[0].reset();
        $('#tableModal').css('display', 'block');
    });

    // Sửa bàn
    window.editTable = function(id) {
        $.getJSON('/api/tables/' + id, function(table) {
            $('#tableId').val(table.id);
            $('#tableName').val(table.name);
            $('#tableNumber').val(table.number);
            $('#tableArea').val(table.area);
            $('#tableCapacity').val(table.capacity);
            $('#tableStatus').val(table.status);
            $('#tableNotes').val(table.notes);
            $('#modalTableTitle').text('Sửa bàn #' + table.number);
            $('#tableModal').css('display', 'block');
        });
    };

    // Lưu bàn
    $('#tableForm').submit(function(e) {
        e.preventDefault();
        const tableData = {
            id: $('#tableId').val(),
            name: $('#tableName').val(),
            number: $('#tableNumber').val(),
            area: $('#tableArea').val(),
            capacity: $('#tableCapacity').val(),
            status: $('#tableStatus').val(),
            notes: $('#tableNotes').val()
        };
        const url = tableData.id ? '/api/tables/' + tableData.id : '/api/tables';
        const method = tableData.id ? 'PUT' : 'POST';
        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify(tableData),
            success: function() {
                $('#tableModal').css('display', 'none');
                loadTables();
            },
            error: function() {
                alert('Lỗi khi lưu bàn!');
            }
        });
    });

    // Xác nhận xóa
    window.confirmDelete = function(id, name) {
        $('#deleteTableName').text(name);
        $('#deleteTableModal').css('display', 'block');
        $('#confirmDeleteBtn').off('click').click(function() {
            $.ajax({
                url: '/api/tables/' + id,
                method: 'DELETE',
                success: function() {
                    $('#deleteTableModal').css('display', 'none');
                    loadTables();
                },
                error: function() {
                    alert('Lỗi khi xóa bàn!');
                }
            });
        });
    };

    // Thay đổi trạng thái
    window.changeStatus = function(id) {
        $('#statusTableId').val(id);
        $('#statusForm')[0].reset();
        $('#statusModal').css('display', 'block');
    };

    // Lưu trạng thái
    $('#statusForm').submit(function(e) {
        e.preventDefault();
        const statusData = {
            status: $('#newStatus').val(),
            notes: $('#statusNote').val()
        };
        $.ajax({
            url: '/api/tables/' + $('#statusTableId').val() + '/status',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(statusData),
            success: function() {
                $('#statusModal').css('display', 'none');
                loadTables();
            },
            error: function() {
                alert('Lỗi khi thay đổi trạng thái!');
            }
        });
    });

    // Đóng modal
    $('.close, [data-close="modal"]').click(function() {
        $(this).closest('.modal').css('display', 'none');
    });

    // Tải dữ liệu ban đầu và làm mới mỗi 30 giây
    loadTables();
    setInterval(loadTables, 30000);
});