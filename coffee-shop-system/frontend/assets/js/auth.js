class AuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.role = localStorage.getItem('role');
        this.userId = localStorage.getItem('userId');
        this.fullName = localStorage.getItem('fullName');
    }

    isLoggedIn() {
        return !!this.token;
    }

    getCurrentUser() {
        if (!this.isLoggedIn()) return null;
        
        return {
            token: this.token,
            role: this.role,
            userId: this.userId,
            fullName: this.fullName
        };
    }

    isCustomer() {
        return this.role && this.role.toLowerCase().includes('customer');
    }

    isStaff() {
        return this.role && this.role.toLowerCase().includes('staff');
    }

    isAdmin() {
        return this.role && this.role.toLowerCase().includes('admin');
    }

    async getLoyaltyPoints() {
        try {
            if (!this.isLoggedIn()) {
                console.error('Người dùng chưa đăng nhập, không thể lấy điểm thưởng');
                return 0;
            }
            
            // Lấy thông tin người dùng hiện tại
            const currentUser = this.getCurrentUser();
            if (!currentUser || !currentUser.userId) {
                console.error('Không tìm thấy thông tin người dùng');
                return 0;
            }
            
            const response = await fetch(`http://localhost:8081/api/accounts/${currentUser.userId}/reward-points`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Điểm thưởng:', data);
            
            // Trả về số điểm thưởng
            return data.rewardPoints || 0;
        } catch (error) {
            console.error('Error loading loyalty points:', error);
            return 0;
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('fullName');
        
        this.token = null;
        this.role = null;
        this.userId = null;
        this.fullName = null;

        window.location.href = '/auth/login.html';
    }

    updateUserInfo(userData) {
        this.token = userData.token;
        this.role = userData.role;
        this.userId = userData.userId;
        this.fullName = userData.fullName;

        localStorage.setItem('token', userData.token);
        localStorage.setItem('role', userData.role);
        localStorage.setItem('userId', userData.userId);
        localStorage.setItem('fullName', userData.fullName);
    }
}

window.AuthManager = new AuthManager();
