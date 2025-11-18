/**
 * Role Utility for Multi-Role System
 * Coffee Shop T2K
 */

const RoleUtils = {
  // Role constants
  ROLES: {
    ADMIN: 'ADMIN',
    CUSTOMER: 'CUSTOMER',
    STAFF_ORDER: 'STAFF_ORDER',
    STAFF_KITCHEN: 'STAFF_KITCHEN',
    STAFF_MANAGER: 'STAFF_MANAGER'
  },

  /**
   * Parse comma-separated roles string into array
   * @param {string} roleString - e.g., "CUSTOMER,STAFF_ORDER"
   * @returns {string[]} Array of roles
   */
  parseRoles(roleString) {
    if (!roleString || typeof roleString !== 'string') {
      return [];
    }
    return roleString.split(',').map(r => r.trim().toUpperCase()).filter(r => r);
  },

  /**
   * Check if user has specific role
   * @param {string} roleString - User's role string (comma-separated)
   * @param {string} targetRole - Role to check
   * @returns {boolean}
   */
  hasRole(roleString, targetRole) {
    const roles = this.parseRoles(roleString);
    return roles.includes(targetRole.toUpperCase());
  },

  /**
   * Check if user has any of the specified roles
   * @param {string} roleString - User's role string
   * @param {string[]} targetRoles - Array of roles to check
   * @returns {boolean}
   */
  hasAnyRole(roleString, targetRoles) {
    const roles = this.parseRoles(roleString);
    return targetRoles.some(target => roles.includes(target.toUpperCase()));
  },

  /**
   * Check if user has all specified roles
   * @param {string} roleString - User's role string
   * @param {string[]} targetRoles - Array of roles to check
   * @returns {boolean}
   */
  hasAllRoles(roleString, targetRoles) {
    const roles = this.parseRoles(roleString);
    return targetRoles.every(target => roles.includes(target.toUpperCase()));
  },

  /**
   * Check if user is admin
   */
  isAdmin(roleString) {
    return this.hasRole(roleString, this.ROLES.ADMIN);
  },

  /**
   * Check if user is customer
   */
  isCustomer(roleString) {
    return this.hasRole(roleString, this.ROLES.CUSTOMER);
  },

  /**
   * Check if user has any staff role
   */
  isStaff(roleString) {
    return this.hasAnyRole(roleString, [
      this.ROLES.STAFF_ORDER,
      this.ROLES.STAFF_KITCHEN,
      this.ROLES.STAFF_MANAGER,
      'STAFF' // Backward compatibility
    ]);
  },

  /**
   * Check if user can access admin panel
   */
  canAccessAdmin(roleString) {
    return this.isAdmin(roleString);
  },

  /**
   * Check if user can access staff panel
   */
  canAccessStaffPanel(roleString) {
    return this.isAdmin(roleString) || this.isStaff(roleString);
  },

  /**
   * Check if user can take orders
   */
  canTakeOrders(roleString) {
    return this.hasAnyRole(roleString, [
      this.ROLES.ADMIN,
      this.ROLES.STAFF_ORDER,
      this.ROLES.STAFF_MANAGER
    ]);
  },

  /**
   * Check if user can work in kitchen
   */
  canWorkInKitchen(roleString) {
    return this.hasAnyRole(roleString, [
      this.ROLES.ADMIN,
      this.ROLES.STAFF_KITCHEN,
      this.ROLES.STAFF_MANAGER
    ]);
  },

  /**
   * Check if user can manage staff operations
   */
  canManageStaff(roleString) {
    return this.hasAnyRole(roleString, [
      this.ROLES.ADMIN,
      this.ROLES.STAFF_MANAGER
    ]);
  },

  /**
   * Get user's primary role (first role in list)
   */
  getPrimaryRole(roleString) {
    const roles = this.parseRoles(roleString);
    return roles.length > 0 ? roles[0] : null;
  },

  /**
   * Get all roles as array
   */
  getAllRoles(roleString) {
    return this.parseRoles(roleString);
  },

  /**
   * Format roles for display
   * @param {string} roleString
   * @returns {string} Human-readable role names
   */
  formatRolesForDisplay(roleString) {
    const roles = this.parseRoles(roleString);
    const roleNames = {
      'ADMIN': 'Quản trị viên',
      'CUSTOMER': 'Khách hàng',
      'STAFF_ORDER': 'NV Order',
      'STAFF_KITCHEN': 'NV Bếp',
      'STAFF_MANAGER': 'Quản lý'
    };
    
    return roles.map(role => roleNames[role] || role).join(', ');
  },

  /**
   * Validate role string format
   */
  isValidRoleString(roleString) {
    if (!roleString || typeof roleString !== 'string') {
      return false;
    }
    
    const roles = this.parseRoles(roleString);
    const validRoles = Object.values(this.ROLES).concat(['STAFF']); // Include backward compat
    
    return roles.every(role => validRoles.includes(role));
  },

  /**
   * Convert old "Staff" role to new format
   */
  migrateOldRole(roleString) {
    if (!roleString) return '';
    
    return roleString
      .split(',')
      .map(r => {
        const trimmed = r.trim().toUpperCase();
        return trimmed === 'STAFF' ? this.ROLES.STAFF_MANAGER : trimmed;
      })
      .join(',');
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RoleUtils;
}
