import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/order.dart';
import '../models/websocket_message.dart';
import '../services/api_service.dart';
import '../services/websocket_service.dart';
import '../services/speech_service.dart';

class StaffProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final WebSocketService _webSocketService = WebSocketService();
  final SpeechService _speechService = SpeechService();

  List<Order> _allOrders = [];
  bool _isLoading = false;
  String? _error;
  bool _isConnected = false;
  String? _staffName;
  Timer? _pollingTimer;

  // Getters
  List<Order> get allOrders => _allOrders;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isConnected => _isConnected;
  String? get staffName => _staffName;

  // Order counts by status
  int get newOrdersCount =>
      _allOrders.where((order) => order.isProcessing).length;
  int get preparingOrdersCount =>
      _allOrders.where((order) => order.isPreparing).length;
  int get readyOrdersCount => _allOrders.where((order) => order.isReady).length;
  int get completedOrdersCount =>
      _allOrders.where((order) => order.isCompleted).length;
  int get cancelledOrdersCount =>
      _allOrders.where((order) => order.isCancelled).length;

  // Initialize staff services
  Future<void> initialize() async {
    _setLoading(true);

    try {
      // Check if user is staff before initializing
      final currentUser = _apiService.currentUser;
      if (currentUser == null || (!currentUser.isStaff && !currentUser.isAdmin)) {
        _setError('User is not authorized for staff operations');
        return;
      }

      // Initialize speech service
      await _speechService.initialize();

      // Load initial orders
      await _loadOrders();

      // Connect to WebSocket
      await _connectWebSocket();

      // Start polling for new orders (fallback if WebSocket fails)
      _startOrderPolling();

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
      // Use getAllOrders for staff (gets all orders, not just customer's orders)
      final orders = await _apiService.getAllOrders();

      // Sắp xếp đơn hàng theo thời gian mới nhất trước
      orders.sort((a, b) {
        if (a.orderTime == null && b.orderTime == null) return 0;
        if (a.orderTime == null) return 1;
        if (b.orderTime == null) return -1;
        return b.orderTime!.compareTo(a.orderTime!);
      });

      _allOrders = orders;
      notifyListeners();
    } catch (e) {
      _setError('Failed to load orders: $e');
    }
  }

  // Connect to WebSocket
  Future<void> _connectWebSocket() async {
    try {
      // Get current user info
      final currentUser = _apiService.currentUser;
      if (currentUser == null) {
        throw Exception('User not logged in');
      }

      _staffName = currentUser.fullName ?? 'Staff';

      // Connect to WebSocket
      final connected = await _webSocketService.connect(
        userId: currentUser.idAccount.toString(),
        userType: 'STAFF',
        deviceId: 'mobile_device',
      );

      if (connected) {
        _isConnected = true;

        // Listen to order notifications
        _webSocketService.orderNotificationStream.listen(
          _handleOrderNotification,
        );

        // Listen to connection status
        _webSocketService.connectionStatusStream.listen(
          _handleConnectionStatus,
        );

        notifyListeners();
      }
    } catch (e) {
      _setError('Failed to connect to WebSocket: $e');
    }
  }

  // Handle order notifications
  void _handleOrderNotification(OrderNotification notification) {
    if (notification.isNewOrder) {
      // Add new order to list
      final order = Order.fromJson(notification.order);
      _allOrders.insert(0, order);

      // Sắp xếp lại danh sách theo thời gian mới nhất
      _allOrders.sort((a, b) {
        if (a.orderTime == null && b.orderTime == null) return 0;
        if (a.orderTime == null) return 1;
        if (b.orderTime == null) return -1;
        return b.orderTime!.compareTo(a.orderTime!);
      });

      // Show notification alert
      _showNewOrderNotification(order);

      // Play notification sound and announce
      _playNotificationSound();
      _speechService.announceNewOrder(
        orderId: order.idOrder!,
        tableNumber: order.tableNumber,
        location: order.location,
        totalAmount: order.totalAmount,
      );

      notifyListeners();
    } else if (notification.isOrderUpdated) {
      // Update existing order
      final updatedOrder = Order.fromJson(notification.order);
      final index = _allOrders.indexWhere(
        (order) => order.idOrder == updatedOrder.idOrder,
      );

      if (index >= 0) {
        _allOrders[index] = updatedOrder;

        // Sắp xếp lại danh sách sau khi cập nhật
        _allOrders.sort((a, b) {
          if (a.orderTime == null && b.orderTime == null) return 0;
          if (a.orderTime == null) return 1;
          if (b.orderTime == null) return -1;
          return b.orderTime!.compareTo(a.orderTime!);
        });

        notifyListeners();
      }
    }
  }

  // Show new order notification
  void _showNewOrderNotification(Order order) {
    // This will be handled by the UI layer
    // For now, just trigger a notification event
    notifyListeners();
  }

  // Play notification sound
  void _playNotificationSound() {
    // Use speech service to play notification sound
    _speechService.playNotificationSound();
  }

  // Handle connection status changes
  void _handleConnectionStatus(String status) {
    _isConnected = status == 'connected';
    notifyListeners();
  }

  // Update order status
  Future<void> updateOrderStatus(int orderId, String status) async {
    try {
      final updatedOrder = await _apiService.updateOrderStatus(orderId, status);

      // Update local order list
      final index = _allOrders.indexWhere((order) => order.idOrder == orderId);
      if (index >= 0) {
        _allOrders[index] = updatedOrder;

        // Sắp xếp lại danh sách sau khi cập nhật
        _allOrders.sort((a, b) {
          if (a.orderTime == null && b.orderTime == null) return 0;
          if (a.orderTime == null) return 1;
          if (b.orderTime == null) return -1;
          return b.orderTime!.compareTo(a.orderTime!);
        });

        notifyListeners();
      }

      // Send WebSocket update
      await _webSocketService.updateOrderStatus(orderId, status);
    } catch (e) {
      _setError('Failed to update order status: $e');
    }
  }

  // Notify staff is ready
  Future<void> notifyReady() async {
    try {
      await _webSocketService.notifyStaffReady(_staffName ?? 'Staff');

      // Show success message
      _clearError();
    } catch (e) {
      _setError('Failed to notify ready status: $e');
    }
  }

  // Get orders by status
  List<Order> getOrdersByStatus(String status) {
    return _allOrders
        .where((order) => order.status?.toLowerCase() == status.toLowerCase())
        .toList();
  }

  // Refresh orders
  Future<void> refreshOrders() async {
    await _loadOrders();
  }

  // Start polling for new orders (fallback if WebSocket fails)
  void _startOrderPolling() {
    _stopOrderPolling();
    _pollingTimer = Timer.periodic(Duration(seconds: 3), (timer) async {
      if (!_isLoading) {
        await _checkForNewOrders();
      }
    });
  }

  // Check for new orders by comparing with previous list
  Future<void> _checkForNewOrders() async {
    try {
      // Only check for orders if user is staff
      final currentUser = _apiService.currentUser;
      if (currentUser == null || (!currentUser.isStaff && !currentUser.isAdmin)) {
        // User is not staff, stop polling
        _stopOrderPolling();
        return;
      }

      final currentOrders = await _apiService.getAllOrders();

      // Sort orders by time
      currentOrders.sort((a, b) {
        if (a.orderTime == null && b.orderTime == null) return 0;
        if (a.orderTime == null) return 1;
        if (b.orderTime == null) return -1;
        return b.orderTime!.compareTo(a.orderTime!);
      });

      // Check if there are new orders
      if (_allOrders.isNotEmpty && currentOrders.isNotEmpty) {
        final latestCurrentOrder = currentOrders.first;
        final latestKnownOrder = _allOrders.first;

        if (latestCurrentOrder.idOrder != latestKnownOrder.idOrder) {
          // Update orders list
          _allOrders = currentOrders;

          // Show notification and play sound
          _showNewOrderNotification(latestCurrentOrder);
          _playNotificationSound();

          // Announce new order
          _speechService.announceNewOrder(
            orderId: latestCurrentOrder.idOrder!,
            tableNumber: latestCurrentOrder.tableNumber,
            location: latestCurrentOrder.location,
            totalAmount: latestCurrentOrder.totalAmount,
          );

          notifyListeners();
          return;
        }
      }

      // Update orders list if different
      if (_allOrders.length != currentOrders.length) {
        _allOrders = currentOrders;
        notifyListeners();
      }
    } catch (e) {
      print('Error checking for new orders: $e');
    }
  }

  // Stop order polling
  void _stopOrderPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  // Test speech
  Future<void> testSpeech() async {
    await _speechService.testSpeech();
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

  // Clear all staff data (called during logout)
  void clearStaffData() {
    _stopOrderPolling();
    _allOrders = [];
    _isLoading = false;
    _error = null;
    _isConnected = false;
    _staffName = null;
    notifyListeners();
  }

  // Dispose resources
  @override
  void dispose() {
    _stopOrderPolling();
    super.dispose();
  }
}
