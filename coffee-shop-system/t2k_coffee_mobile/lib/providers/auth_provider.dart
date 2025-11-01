import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  User? _currentUser;
  bool _isLoading = false;
  String? _error;

  // Getters
  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isLoggedIn => _currentUser != null;
  bool get isAdmin => _currentUser?.isAdmin ?? false;
  bool get isStaff => _currentUser?.isStaff ?? false;
  bool get isCustomer => _currentUser?.isCustomer ?? false;

  // Initialize provider
  Future<void> initialize() async {
    _setLoading(true);
    try {
      await _apiService.initialize();
      _currentUser = _apiService.currentUser;
      _clearError();
    } catch (e) {
      _setError('Failed to initialize: $e');
    } finally {
      _setLoading(false);
    }
  }

  // Login
  Future<bool> login(String username, String password) async {
    _setLoading(true);
    _clearError();

    try {
      final result = await _apiService.login(username, password);

      if (result['token'] != null) {
        _currentUser = _apiService.currentUser;

        // Fetch full account details after login (including reward points and profile info)
        if (_currentUser?.idAccount != null) {
          try {
            // Try to fetch full account first (includes phone, address, reward points)
            final fullAccount = await _apiService.getAccount(
              _currentUser!.idAccount!,
            );
            if (fullAccount != null) {
              _currentUser = fullAccount;
            } else {
              // Fallback: only fetch reward points if getAccount fails
              final points = await _apiService.getRewardPoints(
                _currentUser!.idAccount!,
              );
              if (points != null) {
                _currentUser = _currentUser!.copyWith(rewardPoints: points);
              }
            }
          } catch (e) {
            // If fetching account fails, try to get at least reward points
            try {
              final points = await _apiService.getRewardPoints(
                _currentUser!.idAccount!,
              );
              if (points != null) {
                _currentUser = _currentUser!.copyWith(rewardPoints: points);
              }
            } catch (pointsError) {
              // If both fail, continue with basic user data
            }
          }
        }

        notifyListeners();
        return true;
      } else {
        _setError('Login failed: ${result['message'] ?? 'Unknown error'}');
        return false;
      }
    } catch (e) {
      _setError('Login failed: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Logout
  Future<void> logout() async {
    _setLoading(true);
    try {
      await _apiService.logout();
      _currentUser = null;
      _clearError();
      notifyListeners();
    } catch (e) {
      _setError('Logout failed: $e');
    } finally {
      _setLoading(false);
    }
  }

  // Update user profile
  Future<bool> updateProfile({
    String? fullName,
    String? phone,
    String? address,
  }) async {
    if (_currentUser == null || _currentUser!.idAccount == null) {
      _setError('User not logged in');
      return false;
    }

    _setLoading(true);
    _clearError();

    try {
      // Call API to update profile (similar to FE web)
      final updatedUser = await _apiService.updateAccount(
        _currentUser!.idAccount!,
        fullName: fullName,
        phone: phone,
        address: address,
      );

      if (updatedUser != null) {
        _currentUser = updatedUser;
        notifyListeners();
        return true;
      } else {
        _setError('Failed to update profile: No response from server');
        return false;
      }
    } catch (e) {
      _setError('Failed to update profile: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Register new user
  Future<bool> register({
    required String username,
    required String password,
    required String fullName,
    required String email,
    required String phone,
    required String role,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      final success = await _apiService.register(
        username: username,
        password: password,
        fullName: fullName,
        email: email,
        phone: phone,
        role: role,
      );

      if (success) {
        _clearError();
        return true;
      } else {
        _setError('Đăng ký thất bại. Vui lòng thử lại.');
        return false;
      }
    } catch (e) {
      // Hiển thị message từ exception (đã được parse từ backend)
      final errorMessage = e.toString().replaceFirst('Exception: ', '');
      _setError(
        errorMessage.isNotEmpty
            ? errorMessage
            : 'Đăng ký thất bại. Vui lòng thử lại.',
      );
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Refresh user data from API
  Future<bool> refreshUserData() async {
    if (_currentUser == null || _currentUser!.idAccount == null) {
      return false;
    }

    _setLoading(true);
    _clearError();

    try {
      // Fetch full account details including reward points
      final updatedUser = await _apiService.getAccount(
        _currentUser!.idAccount!,
      );
      if (updatedUser != null) {
        _currentUser = updatedUser;
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      _setError('Failed to refresh user data: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Refresh reward points only (optimized - similar to FE web)
  Future<bool> refreshRewardPoints() async {
    if (_currentUser == null || _currentUser!.idAccount == null) {
      return false;
    }

    _setLoading(true);
    _clearError();

    try {
      final points = await _apiService.getRewardPoints(
        _currentUser!.idAccount!,
      );
      // Always update (even if 0) - getRewardPoints returns 0 on error
      _currentUser = _currentUser!.copyWith(rewardPoints: points ?? 0);
      notifyListeners();
      return true;
    } catch (e) {
      // Don't set error for reward points failure (non-critical)
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update reward points (local only)
  void updateRewardPoints(int points) {
    if (_currentUser != null) {
      _currentUser = _currentUser!.copyWith(rewardPoints: points);
      notifyListeners();
    }
  }

  // Helper methods
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
  }

  void clearError() {
    _clearError();
    notifyListeners();
  }
}
