import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/staff_provider.dart';
import '../../utils/app_theme.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/staff_order_card.dart';
import '../../widgets/connection_status_widget.dart';
import '../../widgets/notification_banner.dart';
import '../../models/order.dart';
import '../../services/speech_service.dart';

class StaffHomeScreen extends StatefulWidget {
  const StaffHomeScreen({super.key});

  @override
  State<StaffHomeScreen> createState() => _StaffHomeScreenState();
}

class _StaffHomeScreenState extends State<StaffHomeScreen>
    with WidgetsBindingObserver {
  Order? _lastNewOrder;
  bool _showNotification = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeStaffServices();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);

    // ✅ Khi app resume, reconnect WebSocket để nhận realtime updates
    if (state == AppLifecycleState.resumed && mounted) {
      print('[StaffHome] App resumed - checking WebSocket connection...');
      final staffProvider = Provider.of<StaffProvider>(context, listen: false);
      // Refresh orders để reconnect WebSocket nếu cần
      staffProvider.refreshOrders();
    }
  }

  Future<void> _initializeStaffServices() async {
    final staffProvider = Provider.of<StaffProvider>(context, listen: false);
    await staffProvider.initialize();
  }

  void _checkForNewOrders(StaffProvider staffProvider) {
    final allOrders = staffProvider.allOrders;
    if (allOrders.isNotEmpty) {
      final latestOrder = allOrders.first;
      if (_lastNewOrder == null ||
          latestOrder.idOrder != _lastNewOrder!.idOrder) {
        _lastNewOrder = latestOrder;
        _showNewOrderNotification(latestOrder);

        // Play notification sound
        final speechService = SpeechService();
        speechService.playNotificationSound();
      }
    }
  }

  void _showNewOrderNotification(Order order) {
    setState(() {
      _showNotification = true;
    });

    // Auto hide after 5 seconds
    Future.delayed(const Duration(seconds: 5), () {
      if (mounted) {
        setState(() {
          _showNotification = false;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('T2K Coffee - Pha chế'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 2,
        shadowColor: AppTheme.primaryColor.withOpacity(0.3),
        centerTitle: true,
        actions: [
          // Connection status
          Consumer<StaffProvider>(
            builder: (context, staffProvider, child) {
              return ConnectionStatusWidget(
                isConnected: staffProvider.isConnected,
                isConnecting: false,
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        staffProvider.isConnected
                            ? 'WebSocket đã kết nối'
                            : 'WebSocket chưa kết nối',
                      ),
                      duration: Duration(seconds: 2),
                    ),
                  );
                },
              );
            },
          ),
          const SizedBox(width: 8),
          // Reload button
          Consumer<StaffProvider>(
            builder: (context, staffProvider, child) {
              return IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: staffProvider.refreshOrders,
              );
            },
          ),
          Consumer<AuthProvider>(
            builder: (context, authProvider, child) {
              return PopupMenuButton<String>(
                icon: const Icon(Icons.account_circle),
                onSelected: (value) {
                  if (value == 'logout') {
                    _showLogoutDialog(context, authProvider);
                  }
                },
                itemBuilder: (context) => [
                  PopupMenuItem(
                    value: 'profile',
                    child: Row(
                      children: [
                        const Icon(Icons.person, size: 20),
                        const SizedBox(width: 8),
                        Text(authProvider.currentUser?.fullName ?? 'Staff'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'logout',
                    child: Row(
                      children: [
                        Icon(
                          Icons.logout,
                          size: 20,
                          color: AppTheme.errorColor,
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Đăng xuất',
                          style: TextStyle(color: AppTheme.errorColor),
                        ),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
      body: Consumer<StaffProvider>(
        builder: (context, staffProvider, child) {
          // Check for new orders
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _checkForNewOrders(staffProvider);
          });

          return Stack(
            children: [
              Column(
                children: [
                  _buildStatusBar(staffProvider),
                  Expanded(child: _buildMainContent(staffProvider)),
                ],
              ),
              // Notification overlay
              if (_showNotification && _lastNewOrder != null)
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: NotificationBanner(
                    title: 'Đơn hàng mới!',
                    message:
                        'Đơn hàng #${_lastNewOrder!.idOrder} - ${_lastNewOrder!.displayLocation}',
                    onTap: () {
                      setState(() {
                        _showNotification = false;
                      });
                    },
                    onDismiss: () {
                      setState(() {
                        _showNotification = false;
                      });
                    },
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildStatusBar(StaffProvider staffProvider) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: Colors.white,
      child: Row(
        children: [
          Expanded(
            child: _buildStatusCard(
              'Mới',
              staffProvider.newOrdersCount.toString(),
              AppTheme.warningColor,
              Icons.add_circle_outline,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildStatusCard(
              'Chế biến',
              staffProvider.preparingOrdersCount.toString(),
              AppTheme.accentColor,
              Icons.coffee,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildStatusCard(
              'Sẵn sàng',
              staffProvider.readyOrdersCount.toString(),
              AppTheme.successColor,
              Icons.check_circle_outline,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusCard(
    String title,
    String count,
    Color color,
    IconData icon,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3), width: 1),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 6),
          Text(
            count,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: TextStyle(
              fontSize: 11,
              color: color,
              fontWeight: FontWeight.w600,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildMainContent(StaffProvider staffProvider) {
    if (staffProvider.isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
        ),
      );
    }

    return Column(
      children: [
        // Quick actions
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Expanded(
                child: CustomButton(
                  text: 'Quản lý',
                  onPressed: () => context.push('/staff/orders'),
                  icon: Icons.receipt_long,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: CustomButton(
                  text: 'Sẵn sàng',
                  onPressed: () => staffProvider.notifyReady(),
                  isOutlined: true,
                  icon: Icons.notifications_active,
                ),
              ),
            ],
          ),
        ),

        // Divider
        Container(
          height: 1,
          margin: const EdgeInsets.symmetric(horizontal: 16),
          color: AppTheme.textSecondary.withOpacity(0.1),
        ),

        // Orders list
        Expanded(child: _buildOrdersList(staffProvider)),
      ],
    );
  }

  Widget _buildOrdersList(StaffProvider staffProvider) {
    final allOrders = staffProvider.allOrders;

    // Lọc chỉ hiển thị đơn hàng chưa hoàn thành
    final activeOrders = allOrders.where((order) {
      final status = order.status?.toLowerCase();
      return status != 'completed' && status != 'cancelled';
    }).toList();

    if (activeOrders.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(50),
                ),
                child: Icon(
                  Icons.coffee_outlined,
                  size: 48,
                  color: AppTheme.primaryColor,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Không có đơn hàng nào',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Tất cả đơn hàng đã hoàn thành!\nĐơn hàng mới sẽ hiển thị ở đây.',
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.only(bottom: 16),
      itemCount: activeOrders.length,
      itemBuilder: (context, index) {
        final order = activeOrders[index];
        return StaffOrderCard(
          order: order,
          onStatusUpdate: (newStatus) =>
              staffProvider.updateOrderStatus(order.idOrder!, newStatus),
        );
      },
    );
  }

  void _showLogoutDialog(BuildContext context, AuthProvider authProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Đăng xuất'),
        content: const Text('Bạn có chắc muốn đăng xuất?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () async {
              // IMPORTANT: Clear data in correct order to prevent race conditions

              // 1. Stop staff provider and disconnect WebSocket
              final staffProvider = Provider.of<StaffProvider>(
                context,
                listen: false,
              );
              staffProvider.clearStaffData();

              // 2. Clear authentication
              await authProvider.logout();

              // 3. Update cart to anonymous mode
              final cartProvider = Provider.of<CartProvider>(
                context,
                listen: false,
              );
              await cartProvider.updateUserId(null);

              if (context.mounted) {
                Navigator.of(context).pop();
                context.go('/login');
              }
            },
            child: const Text('Đăng xuất'),
          ),
        ],
      ),
    );
  }
}
