import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/order.dart';
import '../models/websocket_message.dart';
import '../services/api_service.dart';
import '../services/websocket_service.dart';
import '../services/notification_service.dart';

class CustomerOrderProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final WebSocketService _webSocketService = WebSocketService();
  final NotificationService _notificationService = NotificationService();

  List<Order> _orders = [];
  bool _isLoading = false;
  String? _error;
  bool _isConnected = false;
  bool _isInitialized = false; // Flag to prevent re-initialization
  StreamSubscription? _orderNotificationSubscription;
  StreamSubscription? _connectionStatusSubscription;

  // Getters
  List<Order> get orders => _orders;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isConnected => _isConnected;
  bool get isInitialized => _isInitialized;

  // Get orders by status
  List<Order> get processingOrders =>
      _orders.where((order) => order.isProcessing).toList();
  List<Order> get preparingOrders =>
      _orders.where((order) => order.isPreparing).toList();
  List<Order> get readyOrders =>
      _orders.where((order) => order.isReady).toList();
  List<Order> get completedOrders =>
      _orders.where((order) => order.isCompleted).toList();

  // Initialize customer order tracking
  // This will only run once per provider lifecycle
  Future<void> initialize({bool forceRefresh = false}) async {
    // Skip if already initialized and not forcing refresh
    if (_isInitialized && !forceRefresh) {
      print('[CustomerOrderProvider] Already initialized, skipping...');
      // Just reconnect WebSocket if disconnected
      if (!_isConnected) {
        await _connectWebSocket();
      }
      return;
    }

    print('[CustomerOrderProvider] Initializing...');
    _setLoading(true);

    try {
      // Initialize notification service
      await _notificationService.initialize();

      // Load initial orders only if not initialized or forcing refresh
      if (!_isInitialized || forceRefresh) {
        await _loadOrders();
      }

      // Connect to WebSocket (will skip if already connected)
      await _connectWebSocket();

      _isInitialized = true;
      _clearError();
    } catch (e) {
      _setError('Failed to initialize: $e');
    } finally {
      _setLoading(false);
    }
  }

  // Load orders from API
  Future<void> _loadOrders() async {
    try {
      // Nếu là staff, lấy tất cả đơn hàng; nếu là customer, chỉ lấy đơn của mình
      final orders = await _apiService.getOrdersForCurrentUser();

      // Sort orders by time (newest first)
      orders.sort((a, b) {
        if (a.orderTime == null && b.orderTime == null) return 0;
        if (a.orderTime == null) return 1;
        if (b.orderTime == null) return -1;
        return b.orderTime!.compareTo(a.orderTime!);
      });

      _orders = orders;
      notifyListeners();
    } catch (e) {
      _setError('Failed to load orders: $e');
    }
  }

  // Connect to WebSocket
  Future<void> _connectWebSocket() async {
    // Skip if already connected
    if (_isConnected && _webSocketService.isConnected) {
      print('[CustomerOrderProvider] WebSocket already connected, skipping...');
      return;
    }

    try {
      // Get current user info
      final currentUser = _apiService.currentUser;
      if (currentUser == null) {
        throw Exception('User not logged in');
      }

      print('[CustomerOrderProvider] Connecting to WebSocket...');

      // Connect to WebSocket - use actual user role instead of hardcoded 'CUSTOMER'
      // This allows staff roles (STAFF_ORDER, STAFF_MANAGER, etc.) to subscribe to staff topics
      final connected = await _webSocketService.connect(
        userId: currentUser.idAccount.toString(),
        userType: currentUser.role ?? 'CUSTOMER',
        deviceId: 'mobile_device',
      );

      if (connected) {
        _isConnected = true;

        // Cancel old subscriptions if any
        await _orderNotificationSubscription?.cancel();
        await _connectionStatusSubscription?.cancel();

        // Listen to order notifications
        _orderNotificationSubscription = _webSocketService
            .orderNotificationStream
            .listen(_handleOrderNotification);

        // Listen to connection status
        _connectionStatusSubscription = _webSocketService.connectionStatusStream
            .listen(_handleConnectionStatus);

        print('[CustomerOrderProvider] WebSocket connected successfully');
        notifyListeners();
      }
    } catch (e) {
      _setError('Failed to connect to WebSocket: $e');
    }
  }

  // Handle order notifications
  void _handleOrderNotification(OrderNotification notification) {
    if (notification.isOrderUpdated) {
      // Update existing order
      final updatedOrder = Order.fromJson(notification.order);
      final index = _orders.indexWhere(
        (order) => order.idOrder == updatedOrder.idOrder,
      );

      if (index >= 0) {
        final oldStatus = _orders[index].status;
        _orders[index] = updatedOrder;

        // Sort orders after update
        _orders.sort((a, b) {
          if (a.orderTime == null && b.orderTime == null) return 0;
          if (a.orderTime == null) return 1;
          if (b.orderTime == null) return -1;
          return b.orderTime!.compareTo(a.orderTime!);
        });

        notifyListeners();

        // Show notification if status changed
        if (oldStatus != updatedOrder.status) {
          _notificationService.showOrderStatusNotification(
            orderId: updatedOrder.idOrder!,
            status: updatedOrder.status ?? '',
          );
        }
      }
    } else if (notification.isNewOrder) {
      // Handle new order notification
      // For STAFF: receives all new orders from any customer
      // For CUSTOMER: receives their own new order (so it appears immediately after creation)
      final newOrder = Order.fromJson(notification.order);

      // Check if order already exists to avoid duplicates
      final existingIndex = _orders.indexWhere(
        (order) => order.idOrder == newOrder.idOrder,
      );

      if (existingIndex < 0) {
        // Only add if not already in list
        _orders.insert(0, newOrder);

        // Sort orders
        _orders.sort((a, b) {
          if (a.orderTime == null && b.orderTime == null) return 0;
          if (a.orderTime == null) return 1;
          if (b.orderTime == null) return -1;
          return b.orderTime!.compareTo(a.orderTime!);
        });

        notifyListeners();

        // Show notification for new order
        _notificationService.showOrderStatusNotification(
          orderId: newOrder.idOrder!,
          status: 'Đơn hàng mới',
        );
      }
    }
  }

  // Handle connection status changes
  void _handleConnectionStatus(String status) {
    _isConnected = status == 'connected';
    notifyListeners();

    if (status == 'disconnected' || status == 'error') {
      // Try to reload orders when reconnected
      if (_isConnected) {
        refreshOrders();
      }
    }
  }

  // Refresh orders (manual refresh via pull-to-refresh)
  Future<void> refreshOrders() async {
    print('[CustomerOrderProvider] Manual refresh triggered');
    await _loadOrders();
  }

  // Force re-initialize (use when user logs out and back in)
  Future<void> forceReinitialize() async {
    print('[CustomerOrderProvider] Force re-initialize triggered');
    _isInitialized = false;
    await initialize(forceRefresh: true);
  }

  // Track specific order
  Future<void> trackOrder(int orderId) async {
    try {
      await _webSocketService.trackOrder(orderId);
    } catch (e) {
      _setError('Error tracking order: $e');
    }
  }

  // Clear all data (called during logout)
  Future<void> clearData() async {
    print(
      '[CustomerOrderProvider] Clearing order data and disconnecting WebSocket',
    );

    // Cancel subscriptions first
    await _orderNotificationSubscription?.cancel();
    await _connectionStatusSubscription?.cancel();
    _orderNotificationSubscription = null;
    _connectionStatusSubscription = null;

    // Disconnect WebSocket
    await _webSocketService.disconnect();

    // Clear all data and reset initialization flag
    _orders = [];
    _isLoading = false;
    _error = null;
    _isConnected = false;
    _isInitialized = false; // Reset flag so next login will initialize properly

    notifyListeners();
    print('[CustomerOrderProvider] Order data cleared');
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

  // Dispose resources
  @override
  void dispose() {
    _orderNotificationSubscription?.cancel();
    _connectionStatusSubscription?.cancel();
    super.dispose();
  }
}
