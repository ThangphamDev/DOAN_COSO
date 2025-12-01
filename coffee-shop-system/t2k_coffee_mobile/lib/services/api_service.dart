import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../models/product.dart';
import '../models/category.dart';
import '../models/order.dart';
import '../models/table.dart';
import '../utils/api_config.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _token;
  User? _currentUser;

  // Getters
  String? get token => _token;
  User? get currentUser => _currentUser;
  bool get isLoggedIn => _token != null && _currentUser != null;

  // Initialize service
  Future<void> initialize() async {
    await _loadTokenFromStorage();
  }

  // Load token from shared preferences
  Future<void> _loadTokenFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _token = prefs.getString('auth_token');
      final userJson = prefs.getString('current_user');
      if (userJson != null) {
        _currentUser = User.fromJson(json.decode(userJson));
      }
    } catch (e) {
      _token = null;
      _currentUser = null;
    }
  }

  // Save token to shared preferences
  Future<void> _saveTokenToStorage(String token, User user) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', token);
      await prefs.setString('current_user', json.encode(user.toJson()));
      _token = token;
      _currentUser = user;
    } catch (e) {
      throw Exception('Failed to save authentication data');
    }
  }

  // Clear token from storage
  Future<void> _clearTokenFromStorage() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('current_user');
    _token = null;
    _currentUser = null;
  }

  // Get headers with authentication
  Map<String, String> _getHeaders({Map<String, String>? additionalHeaders}) {
    final headers = Map<String, String>.from(ApiConfig.defaultHeaders);

    // Add ngrok bypass header for free tier (always needed since we use ngrok URLs)
    headers['ngrok-skip-browser-warning'] = 'true';

    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    if (additionalHeaders != null) {
      headers.addAll(additionalHeaders);
    }
    return headers;
  }

  // Make HTTP request
  Future<http.Response> _makeRequest(
    String method,
    String endpoint, {
    Map<String, String>? headers,
    Object? body,
  }) async {
    final url = '${ApiConfig.baseUrl}$endpoint';
    final requestHeaders = _getHeaders(additionalHeaders: headers);

    http.Response response;
    switch (method.toUpperCase()) {
      case 'GET':
        response = await http
            .get(Uri.parse(url), headers: requestHeaders)
            .timeout(Duration(milliseconds: ApiConfig.connectTimeout));
        break;
      case 'POST':
        response = await http
            .post(Uri.parse(url), headers: requestHeaders, body: body)
            .timeout(Duration(milliseconds: ApiConfig.connectTimeout));
        break;
      case 'PUT':
        response = await http
            .put(Uri.parse(url), headers: requestHeaders, body: body)
            .timeout(Duration(milliseconds: ApiConfig.connectTimeout));
        break;
      case 'PATCH':
        response = await http
            .patch(Uri.parse(url), headers: requestHeaders, body: body)
            .timeout(Duration(milliseconds: ApiConfig.connectTimeout));
        break;
      case 'DELETE':
        response = await http
            .delete(Uri.parse(url), headers: requestHeaders)
            .timeout(Duration(milliseconds: ApiConfig.connectTimeout));
        break;
      default:
        throw Exception('Unsupported HTTP method: $method');
    }

    return response;
  }

  // Handle API response
  dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) {
        return {'success': true};
      }
      return json.decode(response.body);
    } else if (response.statusCode == 401) {
      // Unauthorized - clear token
      _clearTokenFromStorage();
      throw Exception('Unauthorized - Please login again');
    } else {
      // Try to parse error message from response body
      try {
        final errorData = json.decode(response.body) as Map<String, dynamic>;
        final message = errorData['message'] as String?;
        if (message != null && message.isNotEmpty) {
          throw Exception(message);
        }
      } catch (e) {
        // If parsing fails, use default error message
      }
      throw Exception('API Error: ${response.statusCode} - ${response.body}');
    }
  }

  // Authentication
  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await _makeRequest(
        'POST',
        ApiConfig.loginEndpoint,
        body: json.encode({'userName': username, 'passWord': password}),
      );

      final data = _handleResponse(response) as Map<String, dynamic>;

      if (data['token'] != null) {
        // Create user object from response
        final user = User(
          idAccount: data['userId'],
          userName: username,
          fullName: data['fullName'],
          role: data['role'],
        );

        await _saveTokenToStorage(data['token'], user);
      }

      return data;
    } catch (e) {
      throw Exception('Login failed: $e');
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
    try {
      final response = await _makeRequest(
        'POST',
        ApiConfig.accountsEndpoint,
        body: json.encode({
          'userName': username,
          'passWord': password,
          'fullName': fullName,
          'email': email,
          'phone': phone,
          'role': role,
        }),
      );

      final data = _handleResponse(response);
      return data != null;
    } catch (e) {
      throw Exception('Registration failed: $e');
    }
  }

  Future<void> logout() async {
    await _clearTokenFromStorage();
  }

  // Get account details
  Future<User?> getAccount(int accountId) async {
    try {
      final response = await _makeRequest(
        'GET',
        '${ApiConfig.accountsEndpoint}/$accountId',
      );
      final data = _handleResponse(response);

      if (data is Map<String, dynamic>) {
        final user = User.fromJson(data);

        // Update current user if it's the same user
        if (_currentUser?.idAccount == accountId) {
          _currentUser = user;
          // Save updated user to storage
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('current_user', json.encode(user.toJson()));
        }
        return user;
      }
      return null;
    } catch (e) {
      throw Exception('Failed to fetch account: $e');
    }
  }

  // Get account by phone number
  Future<User?> getAccountByPhone(String phone) async {
    try {
      final response = await _makeRequest(
        'GET',
        '${ApiConfig.accountsEndpoint}/phone/$phone',
      );
      final data = _handleResponse(response);

      if (data is Map<String, dynamic>) {
        return User.fromJson(data);
      }
      return null;
    } catch (e) {
      throw Exception('Customer not found with phone: $phone');
    }
  }

  // Update account (for profile update)
  Future<User?> updateAccount(
    int accountId, {
    String? fullName,
    String? phone,
    String? address,
  }) async {
    try {
      final accountData = <String, dynamic>{};
      if (fullName != null) accountData['fullName'] = fullName;
      if (phone != null) accountData['phone'] = phone;
      if (address != null) accountData['address'] = address;

      // Preserve existing data that shouldn't change
      if (_currentUser != null) {
        accountData['userName'] = _currentUser!.userName;
        accountData['role'] = _currentUser!.role;
        accountData['rewardPoints'] = _currentUser!.rewardPoints ?? 0;
      }

      final response = await _makeRequest(
        'PUT',
        '${ApiConfig.accountsEndpoint}/$accountId',
        body: json.encode(accountData),
      );

      final data = _handleResponse(response);
      if (data is Map<String, dynamic>) {
        final updatedUser = User.fromJson(data);

        // Update current user if it's the same user
        if (_currentUser?.idAccount == accountId) {
          _currentUser = updatedUser;
          // Save updated user to storage
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(
            'current_user',
            json.encode(updatedUser.toJson()),
          );
        }
        return updatedUser;
      }
      return null;
    } catch (e) {
      throw Exception('Failed to update account: $e');
    }
  }

  // Get reward points (optimized - similar to FE web getLoyaltyPoints)
  Future<int?> getRewardPoints(int accountId) async {
    try {
      final response = await _makeRequest(
        'GET',
        '${ApiConfig.accountsEndpoint}/$accountId/reward-points',
      );
      final data = _handleResponse(response);
      if (data is Map<String, dynamic>) {
        // Support both camelCase and snake_case (from backend)
        final points = (data['rewardPoints'] ?? data['reward_points']) as int?;

        // Update current user's reward points if it's the same user
        if (_currentUser?.idAccount == accountId && points != null) {
          _currentUser = _currentUser!.copyWith(rewardPoints: points);
          // Save updated user to storage
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(
            'current_user',
            json.encode(_currentUser!.toJson()),
          );
        }
        return points ?? 0;
      }
      return 0;
    } catch (e) {
      // Return 0 on error (similar to FE web)
      return 0;
    }
  }

  // Update reward points (set new total points)
  Future<bool> updateRewardPoints(int accountId, int points) async {
    try {
      final response = await _makeRequest(
        'PUT',
        '${ApiConfig.accountsEndpoint}/$accountId/reward-points',
        body: json.encode({'points': points}),
      );
      _handleResponse(response);

      // Update current user's reward points if it's the same user
      if (_currentUser?.idAccount == accountId) {
        _currentUser = _currentUser!.copyWith(rewardPoints: points);
        // Save updated user to storage
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(
          'current_user',
          json.encode(_currentUser!.toJson()),
        );
      }
      return true;
    } catch (e) {
      throw Exception('Failed to update reward points: $e');
    }
  }

  // Add reward points (add to current points)
  Future<bool> addRewardPoints(int accountId, int points) async {
    try {
      final response = await _makeRequest(
        'PUT',
        '${ApiConfig.accountsEndpoint}/$accountId/reward-points/add',
        body: json.encode({'points': points}),
      );
      final data = _handleResponse(response);

      // Update current user's reward points if it's the same user
      if (_currentUser?.idAccount == accountId &&
          data is Map<String, dynamic>) {
        final totalPoints =
            (data['totalPoints'] ?? data['rewardPoints']) as int?;
        if (totalPoints != null) {
          _currentUser = _currentUser!.copyWith(rewardPoints: totalPoints);
          // Save updated user to storage
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(
            'current_user',
            json.encode(_currentUser!.toJson()),
          );
        }
      }
      return true;
    } catch (e) {
      throw Exception('Failed to add reward points: $e');
    }
  }

  // Products
  Future<List<Product>> getProducts() async {
    try {
      final response = await _makeRequest('GET', ApiConfig.productsEndpoint);
      final data = _handleResponse(response);

      if (data is List) {
        return (data as List<dynamic>)
            .map((json) => Product.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      throw Exception('Failed to fetch products: $e');
    }
  }

  // Variants by category
  Future<Map<String, dynamic>> getVariantsByCategory(int categoryId) async {
    try {
      final response = await _makeRequest(
        'GET',
        '${ApiConfig.variantsEndpoint}/category/$categoryId',
      );
      final data = _handleResponse(response);
      if (data is Map<String, dynamic>) return data;
      throw Exception('Invalid variant response format');
    } catch (e) {
      throw Exception('Failed to fetch variants: $e');
    }
  }

  Future<Product?> getProduct(int productId) async {
    try {
      final response = await _makeRequest(
        'GET',
        '${ApiConfig.productsEndpoint}/$productId',
      );
      final data = _handleResponse(response);
      return Product.fromJson(data);
    } catch (e) {
      throw Exception('Failed to fetch product: $e');
    }
  }

  // Categories
  Future<List<Category>> getCategories() async {
    try {
      final response = await _makeRequest('GET', ApiConfig.categoriesEndpoint);
      final data = _handleResponse(response);

      if (data is List) {
        return (data as List<dynamic>)
            .map((json) {
              // Ensure each item is a Map before parsing
              if (json is Map<String, dynamic>) {
                return Category.fromJson(json);
              } else {
                return null;
              }
            })
            .where((category) => category != null)
            .cast<Category>()
            .toList();
      } else if (data is Map) {
        // If data is a single category object, wrap it in a list
        return [Category.fromJson(data as Map<String, dynamic>)];
      }
      return [];
    } catch (e) {
      throw Exception('Failed to fetch categories: $e');
    }
  }

  // Orders - Get orders for current user
  Future<List<Order>> getOrders() async {
    try {
      // First try to get userId from currentUser, fallback to token
      int? userId = _currentUser?.idAccount;
      if (userId == null) {
        userId = await _getUserIdFromToken();
      }

      if (userId == null) {
        throw Exception('User not authenticated');
      }

      final response = await _makeRequest('GET', '/api/orders/account/$userId');
      final data = _handleResponse(response);

      if (data is List) {
        return (data as List<dynamic>)
            .map((json) => Order.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      throw Exception('Failed to fetch orders: $e');
    }
  }

  // Orders - Get orders for current user (staff sees all, customer sees own)
  Future<List<Order>> getOrdersForCurrentUser() async {
    try {
      // Check if current user is staff
      if (_currentUser?.isStaff == true) {
        // Staff xem tất cả đơn hàng
        return await getAllOrders();
      } else {
        // Customer chỉ xem đơn của mình
        return await getOrders();
      }
    } catch (e) {
      throw Exception('Failed to fetch orders for current user: $e');
    }
  }

  // Orders - Get all orders (for staff)
  Future<List<Order>> getAllOrders() async {
    try {
      final response = await _makeRequest('GET', ApiConfig.ordersEndpoint);
      final data = _handleResponse(response);

      if (data is List) {
        return (data as List<dynamic>)
            .map((json) => Order.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      throw Exception('Failed to fetch all orders: $e');
    }
  }

  Future<Order?> getOrder(int orderId) async {
    try {
      final response = await _makeRequest(
        'GET',
        '${ApiConfig.ordersEndpoint}/$orderId',
      );
      final data = _handleResponse(response);
      return Order.fromJson(data);
    } catch (e) {
      throw Exception('Failed to fetch order: $e');
    }
  }

  Future<Order> createOrder(Map<String, dynamic> orderData) async {
    try {
      final response = await _makeRequest(
        'POST',
        ApiConfig.ordersEndpoint,
        body: json.encode(orderData),
      );
      final data = _handleResponse(response);
      return Order.fromJson(data);
    } catch (e) {
      throw Exception('Failed to create order: $e');
    }
  }

  Future<Order> updateOrderStatus(int orderId, String status) async {
    try {
      final response = await _makeRequest(
        'PUT',
        '${ApiConfig.ordersEndpoint}/$orderId/status',
        body: json.encode({'status': status}),
      );
      final data = _handleResponse(response);
      return Order.fromJson(data);
    } catch (e) {
      throw Exception('Failed to update order status: $e');
    }
  }

  Future<Order> updatePaymentInfo(
    int orderId,
    String paymentMethod,
    String paymentStatus,
  ) async {
    try {
      final response = await _makeRequest(
        'PUT',
        '${ApiConfig.ordersEndpoint}/$orderId/payment',
        body: json.encode({
          'paymentMethod': paymentMethod,
          'paymentStatus': paymentStatus,
        }),
      );
      final data = _handleResponse(response);
      return Order.fromJson(data);
    } catch (e) {
      throw Exception('Failed to update payment info: $e');
    }
  }

  // Tables
  Future<List<CafeTable>> getTables() async {
    try {
      final response = await _makeRequest('GET', ApiConfig.tablesEndpoint);
      final data = _handleResponse(response);

      if (data is List) {
        return (data as List<dynamic>)
            .map((json) => CafeTable.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      throw Exception('Failed to fetch tables: $e');
    }
  }

  Future<Table> updateTableStatus(int tableId, String status) async {
    try {
      final response = await _makeRequest(
        'PATCH',
        '${ApiConfig.tablesEndpoint}/$tableId/status?status=$status',
      );
      final data = _handleResponse(response);
      return Table.fromJson(data);
    } catch (e) {
      throw Exception('Failed to update table status: $e');
    }
  }

  // Dashboard
  Future<Map<String, dynamic>> getDashboardSummary() async {
    try {
      final response = await _makeRequest(
        'GET',
        '${ApiConfig.dashboardEndpoint}/summary',
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('Failed to fetch dashboard summary: $e');
    }
  }

  // WebSocket Test
  Future<Map<String, dynamic>> testWebSocketConnection() async {
    try {
      final response = await _makeRequest(
        'GET',
        ApiConfig.websocketTestEndpoint,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('Failed to test WebSocket connection: $e');
    }
  }

  // Check connectivity
  Future<bool> checkConnectivity() async {
    try {
      final response = await _makeRequest(
        'GET',
        ApiConfig.websocketTestEndpoint,
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // MoMo Payment
  Future<Map<String, dynamic>> createMoMoPayment({
    required int orderId,
    required double amount,
    String? orderInfo,
  }) async {
    try {
      final response = await _makeRequest(
        'POST',
        '/api/momo/create',
        body: json.encode({
          'orderId': orderId,
          'amount': amount,
          'orderInfo': orderInfo ?? 'Thanh toan don hang #$orderId',
        }),
      );
      return _handleResponse(response) as Map<String, dynamic>;
    } catch (e) {
      throw Exception('Failed to create MoMo payment: $e');
    }
  }

  Future<Map<String, dynamic>> checkMoMoPaymentStatus(int orderId) async {
    try {
      final response = await _makeRequest('GET', '/api/momo/status/$orderId');
      return _handleResponse(response) as Map<String, dynamic>;
    } catch (e) {
      throw Exception('Failed to check MoMo payment status: $e');
    }
  }

  // Get user ID from JWT token
  Future<int?> _getUserIdFromToken() async {
    try {
      // First check if we have currentUser with ID
      if (_currentUser?.idAccount != null) {
        return _currentUser!.idAccount;
      }

      if (_token == null) return null;

      // Decode JWT token to get user ID
      final parts = _token!.split('.');
      if (parts.length != 3) return null;

      final payload = parts[1];
      // Add padding if needed
      String normalizedPayload = payload;
      switch (payload.length % 4) {
        case 2:
          normalizedPayload += '==';
          break;
        case 3:
          normalizedPayload += '=';
          break;
      }

      final decoded = base64Url.decode(normalizedPayload);
      final payloadMap = json.decode(utf8.decode(decoded));

      return payloadMap['userId'] as int?;
    } catch (e) {
      // Fallback to currentUser if available
      return _currentUser?.idAccount;
    }
  }
}
