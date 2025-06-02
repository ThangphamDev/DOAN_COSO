// auth.js - Authentication utilities and user management

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.role = localStorage.getItem('role');
        this.userId = localStorage.getItem('userId');
        this.fullName = localStorage.getItem('fullName');
    }

    // Check if user is logged in
    isLoggedIn() {
        return !!this.token;
    }

    // Get current user info
    getCurrentUser() {
        if (!this.isLoggedIn()) return null;
        
        return {
            token: this.token,
            role: this.role,
            userId: this.userId,
            fullName: this.fullName
        };
    }

    // Check if user is customer
    isCustomer() {
        return this.role && this.role.toLowerCase().includes('customer');
    }

    // Check if user is staff
    isStaff() {
        return this.role && this.role.toLowerCase().includes('staff');
    }

    // Check if user is admin
    isAdmin() {
        return this.role && this.role.toLowerCase().includes('admin');
    }

    // Get user's loyalty points (from orders)
    async getLoyaltyPoints() {
        if (!this.isCustomer() || !this.userId) {
            return 0;
        }

        try {
            // Fetch user's orders to calculate loyalty points
            const response = await fetch(`http://localhost:8081/api/orders/account/${this.userId}`);
            if (!response.ok) {
                console.warn('Could not fetch user orders for loyalty points');
                return 0;
            }

            const orders = await response.json();
            
            // Calculate loyalty points: 1 point per 1000 VND spent (completed orders only)
            let totalSpent = 0;
            orders.forEach(order => {
                if (order.status === 'completed' || order.status === 'finished') {
                    totalSpent += parseFloat(order.totalAmount || 0);
                }
            });

            return Math.floor(totalSpent / 1000); // 1 point per 1000 VND
        } catch (error) {
            console.warn('Error calculating loyalty points:', error);
            return 0;
        }
    }

    // Logout user
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('fullName');
        
        // Clear current instance
        this.token = null;
        this.role = null;
        this.userId = null;
        this.fullName = null;

        // Redirect to login page or home
        window.location.href = '/auth/login.html';
    }

    // Update user info after login
    updateUserInfo(userData) {
        this.token = userData.token;
        this.role = userData.role;
        this.userId = userData.userId;
        this.fullName = userData.fullName;

        // Update localStorage
        localStorage.setItem('token', userData.token);
        localStorage.setItem('role', userData.role);
        localStorage.setItem('userId', userData.userId);
        localStorage.setItem('fullName', userData.fullName);
    }
}

// Global instance
window.AuthManager = new AuthManager();
