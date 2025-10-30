import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../models/order.dart';
import '../../providers/staff_provider.dart';
import '../../utils/app_theme.dart';
import '../../widgets/custom_button.dart';

class StaffOrderDetailScreen extends StatelessWidget {
  final Order order;

  const StaffOrderDetailScreen({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text('Đơn hàng #${order.idOrder}'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 2,
        shadowColor: AppTheme.primaryColor.withOpacity(0.3),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Order status card
            _buildStatusCard(),
            const SizedBox(height: 16),

            // Order info card
            _buildOrderInfoCard(),
            const SizedBox(height: 16),

            // Order items card
            _buildOrderItemsCard(),
            const SizedBox(height: 16),

            // Payment info card
            if (order.payment != null) ...[
              _buildPaymentCard(),
              const SizedBox(height: 16),
            ],

            // Action buttons
            _buildActionButtons(context),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard() {
    return Card(
      elevation: 3,
      shadowColor: AppTheme.primaryColor.withOpacity(0.1),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _getStatusColor().withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(_getStatusIcon(), color: _getStatusColor(), size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Trạng thái đơn hàng',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    order.statusText,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: _getStatusColor(),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderInfoCard() {
    return Card(
      elevation: 3,
      shadowColor: AppTheme.primaryColor.withOpacity(0.1),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Thông tin đơn hàng',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            _buildInfoRow(
              Icons.location_on_outlined,
              'Vị trí',
              order.displayLocation,
            ),
            const SizedBox(height: 12),
            _buildInfoRow(
              Icons.access_time,
              'Thời gian đặt',
              _formatDateTime(order.orderTime),
            ),
            const SizedBox(height: 12),
            _buildInfoRow(
              Icons.person_outline,
              'Khách hàng',
              order.account?.fullName ?? 'Khách vãng lai',
            ),
            if (order.note != null && order.note!.isNotEmpty) ...[
              const SizedBox(height: 12),
              _buildInfoRow(Icons.note_outlined, 'Ghi chú', order.note!),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildOrderItemsCard() {
    return Card(
      elevation: 3,
      shadowColor: AppTheme.primaryColor.withOpacity(0.1),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Danh sách món',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            if (order.orderDetails != null && order.orderDetails!.isNotEmpty)
              ...order.orderDetails!.map((detail) => _buildOrderItem(detail))
            else
              Text(
                'Không có món nào',
                style: TextStyle(fontSize: 14, color: AppTheme.textSecondary),
              ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Tổng cộng:',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  Text(
                    order.formattedTotalAmount,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderItem(OrderDetail detail) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.backgroundColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.textSecondary.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  detail.product?.productName ?? 'Món không xác định',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ),
              Text(
                'x${detail.quantity}',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.textSecondary,
                ),
              ),
            ],
          ),
          // Hiển thị variants nếu có
          if (detail.hasVariants) ...[
            const SizedBox(height: 8),
            Text(
              detail.variantDescription,
              style: TextStyle(
                fontSize: 13,
                color: AppTheme.textSecondary,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Đơn giá: ${detail.formattedUnitPrice}',
                style: TextStyle(fontSize: 14, color: AppTheme.textSecondary),
              ),
              Text(
                'Thành tiền: ${detail.formattedSubtotal}',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.primaryColor,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentCard() {
    return Card(
      elevation: 3,
      shadowColor: AppTheme.primaryColor.withOpacity(0.1),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Thông tin thanh toán',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            _buildInfoRow(
              Icons.payment,
              'Phương thức',
              order.payment?.paymentMethodText ?? 'Chưa xác định',
            ),
            const SizedBox(height: 12),
            _buildInfoRow(
              Icons.check_circle_outline,
              'Trạng thái',
              order.payment?.paymentStatusText ?? 'Chưa xác định',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppTheme.textSecondary),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: AppTheme.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.textPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    return Consumer<StaffProvider>(
      builder: (context, staffProvider, child) {
        return Column(
          children: [
            if (order.status?.toLowerCase() == 'processing') ...[
              CustomButton(
                text: 'Bắt đầu chế biến',
                onPressed: () {
                  staffProvider.updateOrderStatus(order.idOrder!, 'preparing');
                  context.pop();
                },
                backgroundColor: AppTheme.accentColor,
                icon: Icons.coffee,
              ),
              const SizedBox(height: 12),
              CustomButton(
                text: 'Hủy đơn hàng',
                onPressed: () {
                  _showCancelDialog(context, staffProvider);
                },
                backgroundColor: AppTheme.errorColor,
                icon: Icons.cancel_outlined,
              ),
            ] else if (order.status?.toLowerCase() == 'preparing') ...[
              CustomButton(
                text: 'Hoàn thành chế biến',
                onPressed: () {
                  staffProvider.updateOrderStatus(order.idOrder!, 'ready');
                  context.pop();
                },
                backgroundColor: AppTheme.successColor,
                icon: Icons.check_circle_outline,
              ),
              const SizedBox(height: 12),
              CustomButton(
                text: 'Hủy đơn hàng',
                onPressed: () {
                  _showCancelDialog(context, staffProvider);
                },
                backgroundColor: AppTheme.errorColor,
                icon: Icons.cancel_outlined,
              ),
            ] else if (order.status?.toLowerCase() == 'ready') ...[
              CustomButton(
                text: 'Gửi món cho khách',
                onPressed: () {
                  staffProvider.updateOrderStatus(order.idOrder!, 'completed');
                  context.pop();
                },
                backgroundColor: AppTheme.successColor,
                icon: Icons.delivery_dining,
              ),
            ],
          ],
        );
      },
    );
  }

  void _showCancelDialog(BuildContext context, StaffProvider staffProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận hủy đơn'),
        content: Text('Bạn có chắc chắn muốn hủy đơn hàng #${order.idOrder}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Không'),
          ),
          TextButton(
            onPressed: () {
              staffProvider.updateOrderStatus(order.idOrder!, 'cancelled');
              Navigator.of(context).pop();
              context.pop();
            },
            child: const Text('Có'),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor() {
    switch (order.status?.toLowerCase()) {
      case 'processing':
        return AppTheme.warningColor;
      case 'preparing':
        return AppTheme.accentColor;
      case 'ready':
        return AppTheme.successColor;
      case 'completed':
        return AppTheme.successColor;
      case 'cancelled':
        return AppTheme.errorColor;
      default:
        return AppTheme.textSecondary;
    }
  }

  IconData _getStatusIcon() {
    switch (order.status?.toLowerCase()) {
      case 'processing':
        return Icons.hourglass_empty;
      case 'preparing':
        return Icons.coffee;
      case 'ready':
        return Icons.check_circle_outline;
      case 'completed':
        return Icons.done_all;
      case 'cancelled':
        return Icons.cancel_outlined;
      default:
        return Icons.help_outline;
    }
  }

  String _formatDateTime(DateTime? dateTime) {
    if (dateTime == null) return 'Không xác định';

    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return 'Vừa xong';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes} phút trước';
    } else if (difference.inDays < 1) {
      return '${difference.inHours} giờ trước';
    } else {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
    }
  }
}
