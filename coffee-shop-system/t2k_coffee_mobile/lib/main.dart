import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/staff_provider.dart';
import 'providers/customer_order_provider.dart';
import 'screens/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/auth/role_selection_screen.dart';
import 'screens/customer/customer_home_screen.dart';
import 'screens/customer/menu_screen.dart';
import 'screens/customer/cart_screen.dart';
import 'screens/customer/orders_screen.dart';
import 'screens/customer/profile_screen.dart';
import 'screens/customer/checkout_screen.dart';
import 'screens/customer/order_success_screen.dart';
import 'screens/customer/product_detail_screen.dart';
import 'screens/staff/staff_home_screen.dart';
import 'screens/staff/orders_management_screen.dart';
import 'screens/staff/staff_order_detail_screen.dart';
import 'utils/app_theme.dart';
import 'models/order.dart';
import 'models/product.dart';

void main() {
  runApp(const T2KCoffeeApp());
}

class T2KCoffeeApp extends StatelessWidget {
  const T2KCoffeeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => StaffProvider()),
        ChangeNotifierProvider(create: (_) => CustomerOrderProvider()),
      ],
      child: MaterialApp.router(
        title: 'T2K Coffee',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        routerConfig: _router,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}

// Router configuration
final GoRouter _router = GoRouter(
  initialLocation: '/splash',
  routes: [
    // Splash screen
    GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),

    // Authentication
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: '/role-selection',
      builder: (context, state) => const RoleSelectionScreen(),
    ),

    // Customer routes
    GoRoute(
      path: '/customer',
      builder: (context, state) => const CustomerHomeScreen(),
      routes: [
        GoRoute(path: 'menu', builder: (context, state) => const MenuScreen()),
        GoRoute(path: 'cart', builder: (context, state) => const CartScreen()),
        GoRoute(
          path: 'orders',
          builder: (context, state) => const OrdersScreen(),
        ),
        GoRoute(
          path: 'profile',
          builder: (context, state) => const ProfileScreen(),
        ),
        GoRoute(
          path: 'checkout',
          builder: (context, state) => const CheckoutScreen(),
        ),
        GoRoute(
          path: 'order-success',
          builder: (context, state) {
            final order = state.extra as Order;
            return OrderSuccessScreen(order: order);
          },
        ),
        GoRoute(
          path: 'product-detail',
          builder: (context, state) {
            final product = state.extra as Product;
            return ProductDetailScreen(product: product);
          },
        ),
      ],
    ),

    // Staff routes
    GoRoute(
      path: '/staff',
      builder: (context, state) => const StaffHomeScreen(),
      routes: [
        GoRoute(
          path: 'orders',
          builder: (context, state) => const OrdersManagementScreen(),
        ),
        GoRoute(
          path: 'order-detail',
          builder: (context, state) {
            final order = state.extra as Order;
            return StaffOrderDetailScreen(order: order);
          },
        ),
      ],
    ),
  ],
);
