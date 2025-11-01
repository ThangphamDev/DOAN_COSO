import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/table.dart';
import '../../services/api_service.dart';
import '../../utils/app_theme.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final ApiService _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();
  final _noteController = TextEditingController();

  List<CafeTable> _tables = [];
  CafeTable? _selectedTable;
  String _selectedTableType = 'takeaway'; // 'takeaway' or 'dine_in'
  String _paymentMethod = 'cash';
  bool _isLoading = false;

  // Reward points
  int _availablePoints = 0;
  int _pointsToUse = 0;
  double _previewDiscount = 0.0; // Giảm giá preview (chưa áp dụng)
  double _pointsDiscount = 0.0; // Giảm giá đã áp dụng
  bool _pointsApplied = false;
  static const double _pointsValue = 100.0; // 1 điểm = 100đ (10 điểm = 1000đ)

  @override
  void initState() {
    super.initState();
    _loadTables();
    _loadRewardPoints();
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _loadTables() async {
    try {
      final tables = await _apiService.getTables();
      if (mounted) {
        setState(() {
          _tables = tables.where((table) => table.isAvailable).toList();
        });
      }
    } catch (e) {
      // Silent fail for table loading
    }
  }

  Future<void> _loadRewardPoints() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (!authProvider.isLoggedIn ||
        authProvider.currentUser?.idAccount == null) {
      return;
    }

    try {
      final points = await _apiService.getRewardPoints(
        authProvider.currentUser!.idAccount!,
      );
      if (mounted) {
        setState(() {
          _availablePoints = points ?? 0;
        });
      }
    } catch (e) {
      // Silent fail for reward points loading
    }
  }

  void _updatePointsDiscount(int points) {
    setState(() {
      _pointsToUse = points;
      // Chỉ cập nhật preview discount (chưa áp dụng)
      // Không cập nhật _pointsDiscount cho đến khi nhấn "Áp dụng điểm"
      _previewDiscount = points * _pointsValue; // 1 điểm = 100đ
    });
  }

  void _applyPoints() {
    if (_pointsToUse <= 0 || _pointsToUse > _availablePoints) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Số điểm không hợp lệ'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    final cartProvider = Provider.of<CartProvider>(context, listen: false);
    final maxDiscount = cartProvider.totalAmount;
    final discount = _previewDiscount > maxDiscount
        ? maxDiscount
        : _previewDiscount;

    setState(() {
      _pointsApplied = true;
      _pointsDiscount = discount; // Cập nhật discount đã áp dụng
      // Điều chỉnh số điểm nếu giảm giá lớn hơn tổng tiền
      if (_pointsDiscount > maxDiscount) {
        _pointsToUse = (maxDiscount / _pointsValue).ceil();
        _pointsDiscount = maxDiscount;
        _previewDiscount = maxDiscount;
      }
    });
  }

  void _cancelPoints() {
    setState(() {
      _pointsApplied = false;
      _pointsToUse = 0;
      _pointsDiscount = 0.0;
      _previewDiscount = 0.0;
    });
  }

  int _getMaxPoints() {
    final cartProvider = Provider.of<CartProvider>(context, listen: false);
    final maxDiscountPoints = (cartProvider.totalAmount / _pointsValue).ceil();
    return _availablePoints < maxDiscountPoints
        ? _availablePoints
        : maxDiscountPoints;
  }

  Future<void> _placeOrder() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (mounted) {
      setState(() {
        _isLoading = true;
      });
    }

    try {
      final cartProvider = Provider.of<CartProvider>(context, listen: false);
      final authProvider = Provider.of<AuthProvider>(context, listen: false);

      // Calculate final total with points discount
      final finalTotal = (cartProvider.totalAmount - _pointsDiscount).clamp(
        0.0,
        double.infinity,
      );

      // Prepare order data
      final orderData = {
        'totalAmount': finalTotal,
        'note': _noteController.text.trim().isEmpty
            ? null
            : _noteController.text.trim(),
        'status': 'processing',
        'orderTime': DateTime.now().toIso8601String(),
        'productItems': cartProvider.toOrderItems(),
        'payment': {
          'paymentMethod': _paymentMethod,
          'paymentStatus': 'completed',
          'createAt': DateTime.now().toIso8601String(),
        },
      };

      // Add table information
      if (_selectedTableType == 'dine_in' && _selectedTable != null) {
        orderData['table'] = {'idTable': _selectedTable!.idTable};
      } else if (_selectedTableType == 'takeaway') {
        // Set tableNumber to 'takeaway' for takeaway orders
        orderData['tableNumber'] = 'takeaway';
      }

      // Add account information if logged in
      if (authProvider.isLoggedIn) {
        orderData['accountId'] = authProvider.currentUser!.idAccount;
      }

      // Subtract reward points BEFORE creating order (if applied)
      if (_pointsApplied && _pointsToUse > 0 && authProvider.isLoggedIn) {
        try {
          final currentPoints = authProvider.currentUser?.rewardPoints ?? 0;
          final remainingPoints = (currentPoints - _pointsToUse)
              .clamp(0, double.infinity)
              .toInt();
          await _apiService.updateRewardPoints(
            authProvider.currentUser!.idAccount!,
            remainingPoints,
          );
        } catch (e) {
          // Log error but don't fail the order
        }
      }

      // Create order (backend will automatically add reward points based on totalAmount)
      final order = await _apiService.createOrder(orderData);

      // Refresh reward points after order creation to get updated points
      // (Backend automatically adds points: 1 point per 10,000 VND)
      if (authProvider.isLoggedIn &&
          authProvider.currentUser?.idAccount != null) {
        try {
          await authProvider.refreshRewardPoints();
        } catch (e) {
          // Silent fail - points will be refreshed when user checks profile
        }
      }

      // Clear cart
      cartProvider.clearCart();

      if (mounted) {
        context.push('/customer/order-success', extra: order);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Đặt hàng thất bại: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Thanh toán'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildOrderTypeSection(),
                    const SizedBox(height: 24),
                    _buildTableSelectionSection(),
                    const SizedBox(height: 24),
                    _buildRewardPointsSection(),
                    const SizedBox(height: 24),
                    _buildPaymentMethodSection(),
                    const SizedBox(height: 24),
                    _buildNoteSection(),
                    const SizedBox(height: 24),
                    _buildOrderSummary(),
                  ],
                ),
              ),
            ),
            _buildCheckoutButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderTypeSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Loại đơn hàng',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildOrderTypeOption(
                    'Mang đi',
                    'takeaway',
                    Icons.shopping_bag_outlined,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildOrderTypeOption(
                    'Tại chỗ',
                    'dine_in',
                    Icons.restaurant,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderTypeOption(String title, String value, IconData icon) {
    final isSelected = _selectedTableType == value;

    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedTableType = value;
          if (value == 'takeaway') {
            _selectedTable = null;
          }
        });
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primaryColor.withOpacity(0.1)
              : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondary,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected
                  ? AppTheme.primaryColor
                  : AppTheme.textSecondary,
              size: 32,
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isSelected
                    ? AppTheme.primaryColor
                    : AppTheme.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTableSelectionSection() {
    if (_selectedTableType == 'takeaway') {
      return const SizedBox.shrink();
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Chọn bàn',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            if (_tables.isEmpty)
              const Text(
                'Không có bàn trống',
                style: TextStyle(fontSize: 14, color: AppTheme.textSecondary),
              )
            else
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _tables.map((table) {
                  final isSelected = _selectedTable?.idTable == table.idTable;
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedTable = table;
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppTheme.primaryColor
                            : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSelected
                              ? AppTheme.primaryColor
                              : AppTheme.textSecondary,
                        ),
                      ),
                      child: Text(
                        'Bàn ${table.tableName ?? table.idTable ?? 'Unknown'}',
                        style: TextStyle(
                          color: isSelected
                              ? Colors.white
                              : AppTheme.textPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentMethodSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Phương thức thanh toán',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildPaymentMethodOption(
                    'Tiền mặt',
                    'cash',
                    Icons.money,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildPaymentMethodOption(
                    'Chuyển khoản',
                    'transfer',
                    Icons.account_balance_wallet,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentMethodOption(String title, String value, IconData icon) {
    final isSelected = _paymentMethod == value;

    return GestureDetector(
      onTap: () {
        setState(() {
          _paymentMethod = value;
        });
      },
      child: Container(
        constraints: const BoxConstraints(minHeight: 100),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primaryColor.withOpacity(0.1)
              : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondary,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isSelected
                  ? AppTheme.primaryColor
                  : AppTheme.textSecondary,
              size: 32,
            ),
            const SizedBox(height: 8),
            Text(
              title,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: isSelected
                    ? AppTheme.primaryColor
                    : AppTheme.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoteSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Ghi chú',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            CustomTextField(
              controller: _noteController,
              hint: 'Ghi chú thêm cho đơn hàng (tùy chọn)',
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRewardPointsSection() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (!authProvider.isLoggedIn || _availablePoints <= 0) {
      return const SizedBox.shrink();
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.stars, color: AppTheme.primaryColor, size: 24),
                const SizedBox(width: 8),
                const Text(
                  'Đổi điểm thưởng',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const Spacer(),
                Text(
                  'Có ${_availablePoints} điểm',
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (!_pointsApplied) ...[
              Text(
                'Giảm giá: ${_formatCurrency(_previewDiscount)}',
                style: const TextStyle(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: Slider(
                      value: _pointsToUse.toDouble(),
                      min: 0,
                      max: _getMaxPoints().toDouble(),
                      divisions: _getMaxPoints() > 0 ? _getMaxPoints() : 1,
                      label: '$_pointsToUse điểm',
                      onChanged: (value) {
                        _updatePointsDiscount(value.toInt());
                      },
                    ),
                  ),
                ],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '0',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  Text(
                    '${_getMaxPoints()}',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Nhập số điểm',
                        hintText: '0',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                      ),
                      controller: TextEditingController(text: '$_pointsToUse')
                        ..selection = TextSelection.collapsed(
                          offset: '$_pointsToUse'.length,
                        ),
                      onChanged: (value) {
                        final points = int.tryParse(value) ?? 0;
                        final maxPoints = _getMaxPoints();
                        final adjustedPoints = points.clamp(0, maxPoints);
                        _updatePointsDiscount(adjustedPoints);
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'điểm',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              CustomButton(
                text: 'Áp dụng điểm',
                onPressed: _pointsToUse > 0 ? _applyPoints : null,
                width: double.infinity,
                height: 40,
              ),
            ] else ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Đã áp dụng $_pointsToUse điểm',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Giảm giá: ${_formatCurrency(_pointsDiscount)}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    TextButton(
                      onPressed: _cancelPoints,
                      child: const Text(
                        'Hủy',
                        style: TextStyle(color: AppTheme.errorColor),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatCurrency(double amount) {
    return '${amount.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} đ';
  }

  Widget _buildOrderSummary() {
    return Consumer<CartProvider>(
      builder: (context, cartProvider, child) {
        final subtotal = cartProvider.totalAmount;
        // Chỉ trừ giảm giá khi đã áp dụng điểm (_pointsApplied == true)
        final discount = _pointsApplied ? _pointsDiscount : 0.0;
        final finalTotal = (subtotal - discount).clamp(0.0, double.infinity);

        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Tóm tắt đơn hàng',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                ...cartProvider.items.map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            '${item.productName} x${item.quantity}',
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                        ),
                        Text(
                          item.formattedTotalPrice,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const Divider(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Tạm tính:',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    Text(
                      _formatCurrency(subtotal),
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
                if (_pointsApplied && discount > 0) ...[
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Giảm giá từ điểm:',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppTheme.successColor,
                        ),
                      ),
                      Text(
                        '- ${_formatCurrency(discount)}',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.successColor,
                        ),
                      ),
                    ],
                  ),
                ],
                const Divider(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Tổng cộng:',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    Text(
                      _formatCurrency(finalTotal),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildCheckoutButton() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 10,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: Consumer<CartProvider>(
        builder: (context, cartProvider, child) {
          final subtotal = cartProvider.totalAmount;
          // Chỉ trừ giảm giá khi đã áp dụng điểm (_pointsApplied == true)
          final discount = _pointsApplied ? _pointsDiscount : 0.0;
          final finalTotal = (subtotal - discount).clamp(0.0, double.infinity);
          return CustomButton(
            text: 'Đặt hàng - ${_formatCurrency(finalTotal)}',
            onPressed: _isLoading ? null : _placeOrder,
            isLoading: _isLoading,
            width: double.infinity,
            height: 48,
          );
        },
      ),
    );
  }
}
