package com.t2kcoffee.enums;

/**
 * Role types for the Coffee Shop System
 * Supports multi-role assignment (comma-separated in database)
 */
public enum RoleType {
    /**
     * Administrator - Full system access
     */
    ADMIN,
    
    /**
     * Regular customer - Can order, view menu, manage own orders
     */
    CUSTOMER,
    
    /**
     * Staff member who takes orders - Uses customer UI + some staff features
     * Can create orders on behalf of customers
     */
    STAFF_ORDER,
    
    /**
     * Kitchen staff - Uses staff UI, focuses on order preparation
     * Can view orders, update order status
     */
    STAFF_KITCHEN,
    
    /**
     * Staff manager - Full staff UI access
     * Can manage all staff operations, reports, inventory
     */
    STAFF_MANAGER;
    
    /**
     * Check if this role is any kind of staff role
     */
    public boolean isStaffRole() {
        return this == STAFF_ORDER || this == STAFF_KITCHEN || this == STAFF_MANAGER;
    }
    
    /**
     * Parse comma-separated roles string
     */
    public static RoleType[] parseRoles(String rolesString) {
        if (rolesString == null || rolesString.trim().isEmpty()) {
            return new RoleType[0];
        }
        
        String[] parts = rolesString.split(",");
        RoleType[] roles = new RoleType[parts.length];
        
        for (int i = 0; i < parts.length; i++) {
            String roleName = parts[i].trim().toUpperCase();
            try {
                roles[i] = RoleType.valueOf(roleName);
            } catch (IllegalArgumentException e) {
                // Backward compatibility: treat "STAFF" as STAFF_MANAGER
                if ("STAFF".equals(roleName)) {
                    roles[i] = RoleType.STAFF_MANAGER;
                } else {
                    throw e;
                }
            }
        }
        
        return roles;
    }
    
    /**
     * Convert array of roles to comma-separated string
     */
    public static String rolesToString(RoleType[] roles) {
        if (roles == null || roles.length == 0) {
            return "";
        }
        
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < roles.length; i++) {
            if (i > 0) {
                sb.append(",");
            }
            sb.append(roles[i].name());
        }
        
        return sb.toString();
    }
}
