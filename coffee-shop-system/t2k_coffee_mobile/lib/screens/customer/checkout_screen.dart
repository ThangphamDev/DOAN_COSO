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

  @override
  void initState() {
    super.initState();
    _loadTables();
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
          _tables = tables
              .where((table) => (table as CafeTable).isAvailable)
              .toList();
        });
      }
    } catch (e) {
      print('Error loading tables: $e');
    }
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

      // Prepare order data
      final orderData = {
        'totalAmount': cartProvider.totalAmount,
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

      // Create order
      final order = await _apiService.createOrder(orderData);

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

  Widget _buildOrderSummary() {
    return Consumer<CartProvider>(
      builder: (context, cartProvider, child) {
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
                      'Tổng cộng:',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    Text(
                      cartProvider.formattedTotalAmount,
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
          return CustomButton(
            text: 'Đặt hàng - ${cartProvider.formattedTotalAmount}',
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
