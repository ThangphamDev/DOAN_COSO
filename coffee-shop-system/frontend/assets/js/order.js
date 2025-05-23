/**
 * Order Management Module - T2K Coffee Staff
 * Phiên bản tối ưu hóa với xử lý bất đồng bộ và error handling
 */

const ORDER_API_BASE = 'http://localhost:8081/api/orders';
const ORDER_STATUS = {
    COMPLETED: 'completed',
    PROCESSING: 'processing',
    PENDING: 'pending',
    CANCELLED: 'cancelled'
};

const STATUS_CONFIG = {
    [ORDER_STATUS.COMPLETED]: { class: 'status-success', text: 'Hoàn thành' },
    [ORDER_STATUS.PROCESSING]: { class: 'status-processing', text: 'Đang xử lý' },
    [ORDER_STATUS.PENDING]: { class: 'status-pending', text: 'Đang chờ' },
    [ORDER_STATUS.CANCELLED]: { class: 'status-cancelled', text: 'Đã hủy' }
};

class OrderManager {
    constructor() {
        this.orders = [];
        this.filteredOrders = [];
        this.initElements();
        this.setupEventListeners();
        this.loadOrders();
    }

    initElements() {
        this.elements = {
            orderList: document.querySelector('#ordersTable tbody'),
            searchInput: document.getElementById('searchInput'),
            statusFilter: document.getElementById('statusFilter'),
            orderModal: document.getElementById('orderModal'),
            modalTitle: document.getElementById('modalTitle'),
            modalBody: document.getElementById('modalBody'),
            exportBillBtn: document.getElementById('exportBillBtn')
        };
    }

    setupEventListeners() {
        this.elements.searchInput?.addEventListener('input', this.debounce(this.applyFilters.bind(this), 300));
        this.elements.statusFilter?.addEventListener('change', this.applyFilters.bind(this));
        this.elements.orderModal?.querySelector('.close').addEventListener('click', () => this.closeModal());
        this.elements.exportBillBtn?.addEventListener('click', this.exportBill.bind(this));
        
        // Event delegation for action buttons
        this.elements.orderList?.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-details');
            if (btn) {
                const orderId = btn.dataset.id;
                const status = btn.closest('tr').querySelector('.status').textContent.trim();
                this.handleOrderAction(orderId, status);
            }
        });
    }

    async loadOrders() {
        try {
            const response = await fetch(ORDER_API_BASE);
            this.handleResponseError(response);
            const orders = await response.json();
            
            this.orders = orders.map(this.transformOrderData);
            this.applyFilters();
            this.showToast('Tải dữ liệu đơn hàng thành công', 'success');
        } catch (error) {
            this.handleError('Lỗi tải đơn hàng:', error);
            this.orders = [];
            this.applyFilters();
        }
    }

    transformOrderData(order) {
        return {
            id: order.idOrder,
            customer: order.customerName || 'Khách vãng lai',
            phone: order.phoneNumber || 'N/A',
            table: order.table?.idTable ? `Bàn ${order.table.idTable}` : 'Mang về',
            amount: order.totalAmount || 0,
            status: order.status || ORDER_STATUS.PENDING,
            paymentStatus: order.payment?.paymentStatus || 'pending',
            timestamp: order.orderTime ? new Date(order.orderTime) : new Date()
        };
    }

    renderOrders() {
        if (!this.elements.orderList) return;

        this.elements.orderList.innerHTML = this.filteredOrders.length > 0 
            ? this.filteredOrders.map(order => this.createOrderRow(order)).join('')
            : '<tr><td colspan="7" class="no-data">Không tìm thấy đơn hàng nào</td></tr>';
    }

    createOrderRow(order) {
        const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG[ORDER_STATUS.PENDING];
        const formattedAmount = order.amount.toLocaleString('vi-VN') + ' đ';
        const formattedTime = order.timestamp.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <tr>
                <td>#${order.id}</td>
                <td>${order.customer}</td>
                <td>${order.phone}</td>
                <td>${order.table}</td>
                <td>${formattedAmount}</td>
                <td><span class="status ${statusConfig.class}">${statusConfig.text}</span></td>
                <td>
                    <button class="action-btn btn-details" data-id="${order.id}">
                        <i class="fas fa-${order.status === ORDER_STATUS.COMPLETED ? 'eye' : 'check'}"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    async handleOrderAction(orderId, currentStatus) {
        if (currentStatus === STATUS_CONFIG[ORDER_STATUS.COMPLETED].text) {
            this.showOrderDetails(orderId);
            return;
        }

        try {
            const confirmUpdate = confirm(`Xác nhận cập nhật trạng thái đơn hàng #${orderId}?`);
            if (!confirmUpdate) return;

            const response = await fetch(`${ORDER_API_BASE}/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: ORDER_STATUS.COMPLETED })
            });

            this.handleResponseError(response);
            await this.loadOrders();
            this.showToast('Cập nhật trạng thái thành công', 'success');
        } catch (error) {
            this.handleError('Lỗi cập nhật trạng thái:', error);
        }
    }

    async showOrderDetails(orderId) {
        try {
            const response = await fetch(`${ORDER_API_BASE}/${orderId}`);
            this.handleResponseError(response);
            const orderData = await response.json();
            
            const order = this.transformOrderData(orderData);
            const paymentStatus = order.paymentStatus === 'success' ? 'Đã thanh toán' : 'Chưa thanh toán';
            
            this.elements.modalTitle.innerHTML = `
                <i class="fas fa-receipt"></i> 
                Chi tiết đơn hàng #${order.id}
            `;
            
            this.elements.modalBody.innerHTML = `
                <div class="order-details">
                    <p><strong>Khách hàng:</strong> ${order.customer}</p>
                    <p><strong>Số điện thoại:</strong> ${order.phone}</p>
                    <p><strong>Bàn:</strong> ${order.table}</p>
                    <p><strong>Tổng tiền:</strong> ${order.amount.toLocaleString('vi-VN')} đ</p>
                    <p><strong>Trạng thái:</strong> <span class="${STATUS_CONFIG[order.status].class}">
                        ${STATUS_CONFIG[order.status].text}
                    </span></p>
                    <p><strong>Thanh toán:</strong> ${paymentStatus}</p>
                    <p><strong>Thời gian:</strong> ${order.timestamp.toLocaleString('vi-VN')}</p>
                </div>
            `;

            this.elements.exportBillBtn.style.display = 
                order.status === ORDER_STATUS.COMPLETED ? 'block' : 'none';
            this.elements.exportBillBtn.dataset.orderId = orderId;
            
            this.openModal();
        } catch (error) {
            this.handleError('Lỗi hiển thị chi tiết:', error);
        }
    }

    applyFilters() {
        const searchTerm = this.elements.searchInput?.value.toLowerCase() || '';
        const statusFilter = this.elements.statusFilter?.value || 'all';

        this.filteredOrders = this.orders.filter(order => {
            const matchesSearch = [
                order.id.toString(),
                order.customer.toLowerCase(),
                order.phone.toLowerCase(),
                order.table.toLowerCase()
            ].some(field => field.includes(searchTerm));
            
            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });

        this.renderOrders();
    }

    async exportBill() {
        const orderId = this.elements.exportBillBtn.dataset.orderId;
        if (!orderId) return;

        try {
            const response = await fetch(`${ORDER_API_BASE}/${orderId}/export`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `hoadon_${orderId}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                this.showToast('Xuất hóa đơn thành công', 'success');
            } else {
                throw new Error('Lỗi xuất hóa đơn');
            }
        } catch (error) {
            this.handleError('Lỗi xuất hóa đơn:', error);
        }
    }

    // Helper methods
    debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    handleResponseError(response) {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    }

    handleError(context, error) {
        console.error(context, error);
        this.showToast(`${context} ${error.message}`, 'error');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    openModal() {
        this.elements.orderModal.style.display = 'block';
    }

    closeModal() {
        this.elements.orderModal.style.display = 'none';
    }
}

// Khởi tạo ứng dụng
document.addEventListener('DOMContentLoaded', () => new OrderManager());