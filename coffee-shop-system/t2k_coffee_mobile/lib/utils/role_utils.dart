/// Role Utility for Multi-Role System
/// Coffee Shop T2K - Mobile App

class RoleUtils {
  // Role constants
  static const String ADMIN = 'ADMIN';
  static const String CUSTOMER = 'CUSTOMER';
  static const String STAFF_ORDER = 'STAFF_ORDER';
  static const String STAFF_KITCHEN = 'STAFF_KITCHEN';
  static const String STAFF_MANAGER = 'STAFF_MANAGER';

  /// Parse comma-separated roles string into list
  /// Example: "CUSTOMER,STAFF_ORDER" -> ['CUSTOMER', 'STAFF_ORDER']
  static List<String> parseRoles(String? roleString) {
    if (roleString == null || roleString.trim().isEmpty) {
      return [];
    }
    return roleString
        .split(',')
        .map((r) => r.trim().toUpperCase())
        .where((r) => r.isNotEmpty)
        .toList();
  }

  /// Check if user has specific role
  static bool hasRole(String? roleString, String targetRole) {
    final roles = parseRoles(roleString);
    return roles.contains(targetRole.toUpperCase());
  }

  /// Check if user has any of the specified roles
  static bool hasAnyRole(String? roleString, List<String> targetRoles) {
    final roles = parseRoles(roleString);
    return targetRoles.any((target) => roles.contains(target.toUpperCase()));
  }

  /// Check if user has all specified roles
  static bool hasAllRoles(String? roleString, List<String> targetRoles) {
    final roles = parseRoles(roleString);
    return targetRoles.every((target) => roles.contains(target.toUpperCase()));
  }

  /// Check if user is admin
  static bool isAdmin(String? roleString) {
    return hasRole(roleString, ADMIN);
  }

  /// Check if user is customer
  static bool isCustomer(String? roleString) {
    return hasRole(roleString, CUSTOMER);
  }

  /// Check if user has any staff role
  static bool isStaff(String? roleString) {
    return hasAnyRole(roleString, [
      STAFF_ORDER,
      STAFF_KITCHEN,
      STAFF_MANAGER,
      'STAFF', // Backward compatibility
    ]);
  }

  /// Check if user can access staff panel
  static bool canAccessStaffPanel(String? roleString) {
    return isAdmin(roleString) || isStaff(roleString);
  }

  /// Check if user can take orders
  static bool canTakeOrders(String? roleString) {
    return hasAnyRole(roleString, [ADMIN, STAFF_ORDER, STAFF_MANAGER]);
  }

  /// Check if user can work in kitchen
  static bool canWorkInKitchen(String? roleString) {
    return hasAnyRole(roleString, [ADMIN, STAFF_KITCHEN, STAFF_MANAGER]);
  }

  /// Check if user can manage staff operations
  static bool canManageStaff(String? roleString) {
    return hasAnyRole(roleString, [ADMIN, STAFF_MANAGER]);
  }

  /// Get user's primary role (first role in list)
  static String? getPrimaryRole(String? roleString) {
    final roles = parseRoles(roleString);
    return roles.isNotEmpty ? roles.first : null;
  }

  /// Get all roles as list
  static List<String> getAllRoles(String? roleString) {
    return parseRoles(roleString);
  }

  /// Format roles for display
  static String formatRolesForDisplay(String? roleString) {
    final roles = parseRoles(roleString);
    const roleNames = {
      'ADMIN': 'Quản trị viên',
      'CUSTOMER': 'Khách hàng',
      'STAFF_ORDER': 'NV Order',
      'STAFF_KITCHEN': 'NV Bếp',
      'STAFF_MANAGER': 'Quản lý',
    };

    return roles.map((role) => roleNames[role] ?? role).join(', ');
  }

  /// Validate role string format
  static bool isValidRoleString(String? roleString) {
    if (roleString == null || roleString.trim().isEmpty) {
      return false;
    }

    final roles = parseRoles(roleString);
    const validRoles = [
      ADMIN,
      CUSTOMER,
      STAFF_ORDER,
      STAFF_KITCHEN,
      STAFF_MANAGER,
      'STAFF', // Backward compatibility
    ];

    return roles.every((role) => validRoles.contains(role));
  }

  /// Convert old "Staff" role to new format
  static String migrateOldRole(String? roleString) {
    if (roleString == null || roleString.trim().isEmpty) {
      return '';
    }

    return roleString
        .split(',')
        .map((r) {
          final trimmed = r.trim().toUpperCase();
          return trimmed == 'STAFF' ? STAFF_MANAGER : trimmed;
        })
        .join(',');
  }

  /// Get role badge color
  static String getRoleBadgeColor(String role) {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return '#FF5252'; // Red
      case 'STAFF_MANAGER':
        return '#FF9800'; // Orange
      case 'STAFF_ORDER':
        return '#4CAF50'; // Green
      case 'STAFF_KITCHEN':
        return '#2196F3'; // Blue
      case 'CUSTOMER':
        return '#9E9E9E'; // Grey
      default:
        return '#607D8B'; // Blue Grey
    }
  }

  /// Check if roles include customer access
  /// (Can use customer UI for ordering)
  static bool canUseCustomerUI(String? roleString) {
    return hasAnyRole(roleString, [CUSTOMER, STAFF_ORDER]);
  }

  /// Check if roles include staff UI access
  /// (Can use staff UI for order management)
  static bool canUseStaffUI(String? roleString) {
    return hasAnyRole(roleString, [ADMIN, STAFF_KITCHEN, STAFF_MANAGER]);
  }

  /// Determine which screen to show after login
  static String getDefaultRoute(String? roleString) {
    if (isAdmin(roleString)) {
      return '/admin'; // Admin dashboard
    } else if (canWorkInKitchen(roleString) || canManageStaff(roleString)) {
      return '/staff'; // Staff dashboard
    } else if (canTakeOrders(roleString)) {
      return '/customer'; // Customer UI for taking orders
    } else {
      return '/customer'; // Default customer screen
    }
  }

  /// Check if user can choose role (only Admin and Manager)
  static bool canChooseRole(String? roleString) {
    return hasAnyRole(roleString, [ADMIN, STAFF_MANAGER]);
  }

  /// Get automatic route based on specific role priority
  /// Used when user cannot choose role manually
  static String getAutomaticRoute(String? roleString) {
    final roles = parseRoles(roleString);

    // Priority order:
    // 1. STAFF_KITCHEN -> /staff (kitchen screen)
    // 2. STAFF_ORDER -> /customer (order screen)
    // 3. CUSTOMER -> /customer (customer screen)

    if (roles.contains(STAFF_KITCHEN)) {
      return '/staff'; // Kitchen staff goes to staff screen
    } else if (roles.contains(STAFF_ORDER)) {
      return '/customer'; // Order staff goes to customer screen
    } else if (roles.contains(CUSTOMER)) {
      return '/customer'; // Customer goes to customer screen
    }

    return '/customer'; // Default
  }
}
