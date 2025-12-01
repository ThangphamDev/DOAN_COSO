import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/customer_order_provider.dart';
import '../../utils/app_theme.dart';
import 'modern_menu_screen.dart';
import 'cart_screen.dart';
import 'orders_screen.dart';
import 'profile_screen.dart';
import 'table_management_screen.dart';

class CustomerHomeScreen extends StatefulWidget {
  const CustomerHomeScreen({super.key});

  @override
  State<CustomerHomeScreen> createState() => _CustomerHomeScreenState();
}

class _CustomerHomeScreenState extends State<CustomerHomeScreen> {
  int _currentIndex = 0;
  late PageController _pageController;
  late List<Widget> _screens;
  late bool _isStaffOrder;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();

    // Check if user is STAFF_ORDER
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    _isStaffOrder = authProvider.currentUser?.role == 'STAFF_ORDER';

    // Build screens list based on role
    _screens = [
      const ModernMenuScreen(),
      const CartScreen(),
      const OrdersScreen(),
      const ProfileScreen(),
    ];

    // Add table management for STAFF_ORDER
    if (_isStaffOrder) {
      _screens.insert(3, const TableManagementScreen());
    }

    // Load cart for current user and initialize WebSocket for real-time updates
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final cartProvider = Provider.of<CartProvider>(context, listen: false);
      cartProvider.initialize(authProvider.currentUser?.idAccount);

      // Initialize customer order provider to connect WebSocket immediately after login
      final orderProvider = Provider.of<CustomerOrderProvider>(
        context,
        listen: false,
      );
      orderProvider.initialize();
      print(
        '[CustomerHomeScreen] CustomerOrderProvider initialized for WebSocket connection',
      );
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onTabTapped(int index) {
    setState(() {
      _currentIndex = index;
    });
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PageView(
        controller: _pageController,
        onPageChanged: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 10,
              offset: Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: _onTabTapped,
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          selectedItemColor: AppTheme.primaryColor,
          unselectedItemColor: AppTheme.textSecondary,
          selectedLabelStyle: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
          unselectedLabelStyle: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.normal,
          ),
          items: _buildNavItems(),
        ),
      ),
    );
  }

  List<BottomNavigationBarItem> _buildNavItems() {
    final items = [
      BottomNavigationBarItem(
        icon: _buildNavIcon(Icons.restaurant_menu, 0),
        label: 'Menu',
      ),
      BottomNavigationBarItem(
        icon: _buildNavIcon(Icons.shopping_cart, 1),
        label: 'Giỏ hàng',
      ),
      BottomNavigationBarItem(
        icon: _buildNavIcon(Icons.receipt_long, 2),
        label: 'Đơn hàng',
      ),
    ];

    // Add table management for STAFF_ORDER before profile
    if (_isStaffOrder) {
      items.add(
        BottomNavigationBarItem(
          icon: _buildNavIcon(Icons.table_restaurant, 3),
          label: 'Quản lý bàn',
        ),
      );
    }

    // Profile always last
    items.add(
      BottomNavigationBarItem(
        icon: _buildNavIcon(Icons.person, _isStaffOrder ? 4 : 3),
        label: 'Hồ sơ',
      ),
    );

    return items;
  }

  Widget _buildNavIcon(IconData icon, int index) {
    return Stack(
      children: [
        Icon(icon, size: 24),
        if (index == 1) // Cart icon with badge
          Consumer<CartProvider>(
            builder: (context, cartProvider, child) {
              if (cartProvider.itemCount > 0) {
                return Positioned(
                  right: -2,
                  top: -2,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: AppTheme.errorColor,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      cartProvider.itemCount.toString(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),
      ],
    );
  }
}
