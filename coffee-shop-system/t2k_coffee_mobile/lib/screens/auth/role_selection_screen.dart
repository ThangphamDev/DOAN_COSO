import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../utils/role_utils.dart';

/// Role Selection Screen
/// Shows when user has multiple roles and needs to choose which role to use
class RoleSelectionScreen extends StatelessWidget {
  const RoleSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.currentUser;

    if (user == null) {
      // If no user, go back to login
      WidgetsBinding.instance.addPostFrameCallback((_) {
        context.go('/login');
      });
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final roles = user.roles;

    // Admin always gets to choose between interfaces
    final isAdmin = RoleUtils.isAdmin(user.role);

    // If single role (not admin), automatically navigate
    if (roles.length == 1 && !isAdmin) {
      final route = RoleUtils.getAutomaticRoute(user.role);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        context.go(route);
      });
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    // Build role options for selection
    List<String> roleOptions;
    if (isAdmin && roles.length == 1) {
      // Admin with single ADMIN role: show both staff and customer options
      roleOptions = ['ADMIN_STAFF', 'ADMIN_CUSTOMER'];
    } else {
      // Multi-role user: show their actual roles
      roleOptions = roles;
    }
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Theme.of(context).primaryColor,
              Theme.of(context).primaryColor.withOpacity(0.7),
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo or Icon
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Icon(
                    Icons.person_outline,
                    size: 60,
                    color: Theme.of(context).primaryColor,
                  ),
                ),
                const SizedBox(height: 30),

                // Welcome text
                Text(
                  'Xin chào, ${user.fullName ?? user.userName}!',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 10),

                Text(
                  'Bạn có nhiều vai trò. Chọn vai trò để tiếp tục:',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white.withOpacity(0.9),
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 40),

                // Role selection cards
                ...roleOptions.map(
                  (role) => _RoleCard(role: role, fullRoleString: user.role),
                ),

                const SizedBox(height: 30),

                // Logout button
                TextButton(
                  onPressed: () {
                    authProvider.logout();
                    context.go('/login');
                  },
                  child: Text(
                    'Đăng xuất',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.8),
                      fontSize: 16,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final String role;
  final String? fullRoleString;

  const _RoleCard({required this.role, this.fullRoleString});

  @override
  Widget build(BuildContext context) {
    IconData icon;
    String title;
    String description;
    String route;

    switch (role.toUpperCase()) {
      case 'ADMIN':
        icon = Icons.admin_panel_settings;
        title = 'Quản trị viên';
        description = 'Quản lý toàn bộ hệ thống';
        route = '/staff';
        break;
      case 'ADMIN_STAFF':
        icon = Icons.restaurant_menu;
        title = 'Quản lý nhân viên';
        description = 'Màn hình quản lý đơn hàng và bếp';
        route = '/staff';
        break;
      case 'ADMIN_CUSTOMER':
        icon = Icons.shopping_bag;
        title = 'Giao diện khách hàng';
        description = 'Xem menu và đặt hàng';
        route = '/customer';
        break;
      case 'STAFF_MANAGER':
        icon = Icons.manage_accounts;
        title = 'Quản lý';
        description = 'Quản lý nhân viên và hoạt động';
        route = '/staff';
        break;
      case 'STAFF_KITCHEN':
        icon = Icons.restaurant;
        title = 'Nhân viên bếp';
        description = 'Quản lý và chế biến đơn hàng';
        route = '/staff';
        break;
      case 'STAFF_ORDER':
        icon = Icons.shopping_cart;
        title = 'Nhân viên order';
        description = 'Nhận và tạo đơn hàng';
        route = '/customer';
        break;
      case 'CUSTOMER':
        icon = Icons.person;
        title = 'Khách hàng';
        description = 'Đặt hàng và xem menu';
        route = '/customer';
        break;
      default:
        icon = Icons.help_outline;
        title = role;
        description = 'Vai trò khác';
        route = '/customer';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        elevation: 4,
        child: InkWell(
          onTap: () {
            context.go(route);
          },
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    icon,
                    size: 32,
                    color: Theme.of(context).primaryColor,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        description,
                        style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios,
                  color: Colors.grey[400],
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
