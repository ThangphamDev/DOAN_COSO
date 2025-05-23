/**
 * Payment Manager Module - T2K Coffee Staff
 * Module quản lý thanh toán cho nhân viên, tích hợp với API và hỗ trợ đầy đủ chức năng
 */

// Constants
const PAYMENT_API_URL = 'http://localhost:8081/api/payments';
const STATUS_CLASSES = {
    'success': 'status-success',
    'failed': 'status-failed'
};
const STATUS_TRANSLATIONS = {
    'success': 'Thành công',
    'failed': 'Thất bại'
};
const METHOD_TRANSLATIONS = {
    'cash': 'Tiền mặt',
    'online': 'Online',
    'transfer': 'Chuyển khoản'
};

// State variables
let payments = [];
let filteredPayments = [];
let currentPaymentId = null;

// DOM Elements
let paymentList;
let searchInput;
let statusFilterSelect;
let methodFilterSelect;
let paymentModal;
let deleteModal;

// Khởi tạo khi trang tải xong
document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo tham chiếu đến các phần tử DOM
    initDOMReferences();

    // Thiết lập các sự kiện
    setupEventListeners();

    // Thiết lập modal
    setupModals();

    // Tải dữ liệu thanh toán từ API
    loadPayments();
});

// Khởi tạo tham chiếu đến các phần tử DOM
function initDOMReferences() {
    paymentList = document.querySelector('#paymentsTable tbody');
    searchInput = document.getElementById('searchInput');
    statusFilterSelect = document.getElementById('statusFilter');
    methodFilterSelect = document.getElementById('methodFilter');
    paymentModal = document.getElementById('paymentModal');
    deleteModal = document.getElementById('deletePaymentModal') || createDeleteModal();
}

// Tạo modal xóa nếu chưa có
function createDeleteModal() {
    const modal = document.createElement('div');
    modal.id = 'deletePaymentModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">×</span>
            <h2>Xác nhận xóa</h2>
            <p>Bạn có chắc chắn muốn xóa thanh toán <span id="deletePaymentId"></span> không?</p>
            <button id="confirmDeleteBtn">Xóa</button>
            <button class="close">Hủy</button>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

// Thiết lập các sự kiện
function setupEventListeners() {
    // Tìm kiếm
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    // Lọc theo trạng thái và phương thức
    if (statusFilterSelect) {
        statusFilterSelect.addEventListener('change', applyFilters);
    }
    if (methodFilterSelect) {
        methodFilterSelect.addEventListener('change', applyFilters);
    }

    // Xác nhận xóa
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            if (currentPaymentId && currentPaymentId !== 'N/A') {
                deletePayment(currentPaymentId);
                closeModal(deleteModal);
            } else {
                alert('Không thể xóa: ID thanh toán không hợp lệ.');
            }
        });
    }
}

// Thiết lập modal
function setupModals() {
    const closeBtns = document.querySelectorAll('.close');
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

// Tải dữ liệu thanh toán từ API
async function loadPayments() {
    try {
        const response = await fetch(PAYMENT_API_URL);
        if (!response.ok) {
            throw new Error('Không thể tải dữ liệu thanh toán. Mã lỗi: ' + response.status);
        }
        const data = await response.json();
        payments = data.map(payment => ({
            id: payment.idPayment ?? 'N/A',
            customer: payment.order?.customerName || 'Khách vãng lai',
            amount: payment.order?.amount ?? 0,
            method: payment.paymentMethod || 'Không xác định',
            status: payment.paymentStatus || 'failed',
            time: payment.createAt ? new Date(payment.createAt).toLocaleString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }) : 'Không xác định',
            orderId: payment.order?.idOrder ?? 'N/A',
            table: payment.order?.table || 'N/A',
            quantity: payment.order?.quantity ?? 0,
            totalAmount: payment.order?.totalAmount ?? 0,
            notes: payment.order?.notes || ''
        }));
        filteredPayments = [...payments];
        renderPayments();
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu thanh toán:', error);
        alert('Không thể tải dữ liệu thanh toán: ' + error.message);
        payments = [];
        filteredPayments = [];
        renderPayments();
    }
}

// Hiển thị danh sách thanh toán
function renderPayments() {
    if (!paymentList) return;
    paymentList.innerHTML = '';

    if (filteredPayments.length === 0) {
        paymentList.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">Không tìm thấy thanh toán nào</td>
            </tr>
        `;
        return;
    }

    filteredPayments.forEach(payment => {
        const row = createPaymentRow(payment);
        paymentList.appendChild(row);
    });
}

// Tạo dòng dữ liệu cho thanh toán
function createPaymentRow(payment) {
    const row = document.createElement('tr');
    const statusClass = STATUS_CLASSES[payment.status] || 'status-failed';
    const statusText = STATUS_TRANSLATIONS[payment.status] || payment.status;
    const methodText = METHOD_TRANSLATIONS[payment.method] || payment.method;
    const formattedAmount = typeof payment.amount === 'number' ? payment.amount.toLocaleString('vi-VN') : '0';

    row.innerHTML = `
        <td>${payment.id}</td>
        <td>${payment.customer}</td>
        <td>${formattedAmount} VNĐ</td>
        <td>${methodText}</td>
        <td><span class="status ${statusClass}" style="cursor:pointer;" title="Nhấn để thay đổi trạng thái">${statusText}</span></td>
        <td>${payment.time}</td>
        <td>
            <button class="action-btn btn-details" data-id="${payment.id}" title="Xem chi tiết"><i class="fa fa-eye"></i></button>
            <button class="action-btn btn-status" data-id="${payment.id}" title="Thay đổi trạng thái"><i class="fa fa-sync"></i></button>
            <button class="action-btn btn-delete" data-id="${payment.id}" title="Xóa"><i class="fa fa-trash"></i></button>
        </td>
    `;

    const statusBadge = row.querySelector('.status');
    if (statusBadge) {
        statusBadge.addEventListener('click', () => openStatusModal(payment));
    }

    const detailsBtn = row.querySelector('.btn-details');
    if (detailsBtn && payment.id !== 'N/A') {
        detailsBtn.addEventListener('click', () => fetchPaymentDetails(payment.id));
    }

    const statusBtn = row.querySelector('.btn-status');
    if (statusBtn) {
        statusBtn.addEventListener('click', () => openStatusModal(payment));
    }

    const deleteBtn = row.querySelector('.btn-delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => confirmDeletePayment(payment.id));
    }

    return row;
}

// Áp dụng bộ lọc
async function applyFilters() {
    const searchText = searchInput ? searchInput.value.toLowerCase() : '';
    const statusFilter = statusFilterSelect ? statusFilterSelect.value : 'all';
    const methodFilter = methodFilterSelect ? methodFilterSelect.value : 'all';

    try {
        let filteredData = payments;

        // Lọc theo trạng thái nếu không phải 'all'
        if (statusFilter !== 'all') {
            try {
                const response = await fetch(`${PAYMENT_API_URL}/status/${statusFilter}`);
                if (!response.ok) {
                    throw new Error('Không thể lọc theo trạng thái. Mã lỗi: ' + response.status);
                }
                filteredData = await response.json();
                filteredData = filteredData.map(payment => ({
                    id: payment.idPayment ?? 'N/A',
                    customer: payment.order?.customerName || 'Khách vãng lai',
                    amount: payment.order?.amount ?? 0,
                    method: payment.paymentMethod || 'Không xác định',
                    status: payment.paymentStatus || 'failed',
                    time: payment.createAt ? new Date(payment.createAt).toLocaleString('vi-VN', {
                        timeZone: 'Asia/Ho_Chi_Minh',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    }) : 'Không xác định',
                    orderId: payment.order?.idOrder ?? 'N/A',
                    table: payment.order?.table || 'N/A',
                    quantity: payment.order?.quantity ?? 0,
                    totalAmount: payment.order?.totalAmount ?? 0,
                    notes: payment.order?.notes || ''
                }));
            } catch (error) {
                console.error('Lỗi khi lọc theo trạng thái:', error);
                filteredData = [];
            }
        }

        // Lọc theo phương thức nếu không phải 'all'
        if (methodFilter !== 'all') {
            try {
                const response = await fetch(`${PAYMENT_API_URL}/method/${methodFilter}`);
                if (!response.ok) {
                    throw new Error('Không thể lọc theo phương thức. Mã lỗi: ' + response.status);
                }
                const methodData = await response.json();
                const methodDataMapped = methodData.map(payment => ({
                    id: payment.idPayment ?? 'N/A',
                    customer: payment.order?.customerName || 'Khách vãng lai',
                    amount: payment.order?.amount ?? 0,
                    method: payment.paymentMethod || 'Không xác định',
                    status: payment.paymentStatus || 'failed',
                    time: payment.createAt ? new Date(payment.createAt).toLocaleString('vi-VN', {
                        timeZone: 'Asia/Ho_Chi_Minh',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    }) : 'Không xác định',
                    orderId: payment.order?.idOrder ?? 'N/A',
                    table: payment.order?.table || 'N/A',
                    quantity: payment.order?.quantity ?? 0,
                    totalAmount: payment.order?.totalAmount ?? 0,
                    notes: payment.order?.notes || ''
                }));
                filteredData = filteredData.filter(payment => 
                    methodDataMapped.some(methodPayment => methodPayment.id === payment.id)
                );
            } catch (error) {
                console.error('Lỗi khi lọc theo phương thức:', error);
                filteredData = [];
            }
        }

        // Lọc theo tìm kiếm
        filteredPayments = filteredData.filter(payment => {
            const matchesSearch = 
                payment.customer.toLowerCase().includes(searchText) || 
                (payment.id && payment.id.toString().includes(searchText));
            return matchesSearch;
        });

        renderPayments();
    } catch (error) {
        console.error('Lỗi khi áp dụng bộ lọc:', error);
        alert('Không thể áp dụng bộ lọc: ' + error.message);
        filteredPayments = [];
        renderPayments();
    }
}

// Lấy chi tiết thanh toán từ API
async function fetchPaymentDetails(paymentId) {
    try {
        const response = await fetch(`${PAYMENT_API_URL}/${paymentId}`);
        if (!response.ok) {
            throw new Error('Không thể lấy chi tiết thanh toán. Mã lỗi: ' + response.status);
        }
        const payment = await response.json();
        const mappedPayment = {
            id: payment.idPayment ?? 'N/A',
            customer: payment.order?.customerName || 'Khách vãng lai',
            amount: payment.order?.amount ?? 0,
            method: payment.paymentMethod || 'Không xác định',
            status: payment.paymentStatus || 'failed',
            time: payment.createAt ? new Date(payment.createAt).toLocaleString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }) : 'Không xác định',
            orderId: payment.order?.idOrder ?? 'N/A',
            table: payment.order?.table || 'N/A',
            quantity: payment.order?.quantity ?? 0,
            totalAmount: payment.order?.totalAmount ?? 0,
            notes: payment.order?.notes || ''
        };
        showPaymentDetails(mappedPayment);
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết thanh toán:', error);
        alert('Không thể lấy chi tiết thanh toán: ' + error.message);
    }
}

// Hiển thị chi tiết thanh toán
function showPaymentDetails(payment) {
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    if (modalTitle && modalBody) {
        modalTitle.innerHTML = `<i class="fa fa-money-bill"></i> Chi tiết thanh toán #${payment.id}`;
        const formattedAmount = typeof payment.amount === 'number' ? payment.amount.toLocaleString('vi-VN') : '0';
        const formattedTotalAmount = typeof payment.totalAmount === 'number' ? payment.totalAmount.toLocaleString('vi-VN') : '0';

        modalBody.innerHTML = `
            <p><strong>ID Thanh toán:</strong> ${payment.id}</p>
            <p><strong>Khách hàng:</strong> ${payment.customer}</p>
            <p><strong>Số tiền:</strong> ${formattedAmount} VNĐ</p>
            <p><strong>Phương thức:</strong> ${METHOD_TRANSLATIONS[payment.method] || payment.method}</p>
            <p><strong>Trạng thái:</strong> <span class="status ${STATUS_CLASSES[payment.status]}">${STATUS_TRANSLATIONS[payment.status] || payment.status}</span></p>
            <p><strong>Thời gian:</strong> ${payment.time}</p>
            <p><strong>Mã đơn hàng:</strong> ${payment.orderId}</p>
            <p><strong>Bàn:</strong> ${payment.table}</p>
            <p><strong>Số lượng:</strong> ${payment.quantity}</p>
            <p><strong>Tổng cộng:</strong> ${formattedTotalAmount} VNĐ</p>
            <p><strong>Ghi chú:</strong> ${payment.notes || 'Không có'}</p>
        `;
        openModal(paymentModal);
    }
}

// Mở modal thay đổi trạng thái
function openStatusModal(payment) {
    currentPaymentId = payment.id;
    let statusModal = document.getElementById('statusModal');
    if (!statusModal) {
        statusModal = document.createElement('div');
        statusModal.id = 'statusModal';
        statusModal.className = 'modal';
        statusModal.innerHTML = `
            <div class="modal-content">
                <span class="close">×</span>
                <h2>Thay đổi trạng thái thanh toán</h2>
                <form id="statusForm">
                    <input type="hidden" id="statusPaymentId" value="${payment.id}">
                    <label for="newStatus">Trạng thái mới:</label>
                    <select id="newStatus">
                        <option value="success">Thành công</option>
                        <option value="failed">Thất bại</option>
                    </select>
                    <button type="submit">Cập nhật</button>
                </form>
            </div>
        `;
        document.body.appendChild(statusModal);

        const statusForm = document.getElementById('statusForm');
        if (statusForm) {
            statusForm.addEventListener('submit', function(e) {
                e.preventDefault();
                updatePaymentStatus();
            });
        }

        const closeBtn = statusModal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal(statusModal));
        }
    }

    document.getElementById('statusPaymentId').value = payment.id;
    document.getElementById('newStatus').value = payment.status;
    openModal(statusModal);
}

// Cập nhật trạng thái thanh toán
async function updatePaymentStatus() {
    try {
        const paymentId = document.getElementById('statusPaymentId').value;
        const newStatus = document.getElementById('newStatus').value;

        const response = await fetch(`${PAYMENT_API_URL}/${paymentId}/status?status=${newStatus}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Lỗi: ${response.status} - ${response.statusText}`);
        }

        const statusModal = document.getElementById('statusModal');
        closeModal(statusModal);
        await loadPayments();
        alert('Cập nhật trạng thái thành công');
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái:', error);
        alert(`Không thể cập nhật trạng thái: ${error.message}`);
    }
}

// Xác nhận xóa thanh toán
function confirmDeletePayment(paymentId) {
    currentPaymentId = paymentId;
    const deletePaymentId = document.getElementById('deletePaymentId');
    if (deletePaymentId && currentPaymentId !== 'N/A') {
        deletePaymentId.textContent = `#${currentPaymentId}`;
    } else {
        deletePaymentId.textContent = 'Không xác định';
    }
    openModal(deleteModal);
}

// Xóa thanh toán
async function deletePayment(paymentId) {
    try {
        const response = await fetch(`${PAYMENT_API_URL}/${paymentId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Lỗi: ${response.status} - ${response.statusText}`);
        }

        payments = payments.filter(payment => payment.id !== paymentId);
        filteredPayments = filteredPayments.filter(payment => payment.id !== paymentId);
        renderPayments();
        alert('Đã xóa thanh toán thành công');
    } catch (error) {
        console.error('Lỗi khi xóa thanh toán:', error);
        alert(`Không thể xóa thanh toán: ${error.message}`);
    }
}

// Hàm tìm kiếm (gắn với nút tìm kiếm)
function searchPayments() {
    applyFilters();
}

// Hàm lọc (gắn với dropdown)
function filterPayments() {
    applyFilters();
}