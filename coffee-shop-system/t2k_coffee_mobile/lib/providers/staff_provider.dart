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
  StreamSubscription<OrderNotification>? _orderNotificationSubscription;
  StreamSubscription<String>? _connectionStatusSubscription;

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
      if (currentUser == null ||
          (!currentUser.isStaff && !currentUser.isAdmin)) {
        _setError('User is not authorized for staff operations');
        return;
      }

      // Initialize speech service
      await _speechService.initialize();

      // Load initial orders
      await _loadOrders();

      // Connect to WebSocket
      await _connectWebSocket();

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

        // Cancel existing subscriptions if any
        _orderNotificationSubscription?.cancel();
        _connectionStatusSubscription?.cancel();

        // Listen to order notifications with error handling
        _orderNotificationSubscription = _webSocketService
            .orderNotificationStream
            .listen(
              _handleOrderNotification,
              onError: (error) {
                // Don't let stream errors disconnect WebSocket
              },
              onDone: () {
                // Stream closed, but don't auto-reconnect here
                // Let WebSocketService handle reconnection
              },
              cancelOnError: false, // Don't cancel on error
            );

        // Listen to connection status with error handling
        _connectionStatusSubscription = _webSocketService.connectionStatusStream
            .listen(
              _handleConnectionStatus,
              onError: (error) {
                // Don't let stream errors disconnect WebSocket
              },
              onDone: () {
                // Connection status stream closed
              },
              cancelOnError: false, // Don't cancel on error
            );

        notifyListeners();
      }
    } catch (e) {
      _setError('Failed to connect to WebSocket: $e');
    }
  }

  // Handle order notifications
  void _handleOrderNotification(OrderNotification notification) {
    // Run async operations without blocking the stream listener
    _processOrderNotification(notification).catchError((error) {
      // Continue processing even if there's an error
    });
  }

  // Process order notification asynchronously
  Future<void> _processOrderNotification(OrderNotification notification) async {
    try {
      if (notification.isNewOrder) {
        // Parse order from notification
        final order = Order.fromJson(notification.order);

        if (order.idOrder == null) {
          return;
        }

        // Check if order already exists to avoid duplicates
        final existingIndex = _allOrders.indexWhere(
          (o) => o.idOrder == order.idOrder,
        );

        Order? finalOrder;

        if (existingIndex >= 0) {
          // Order already exists, update it instead
          // Fetch full order details from API to ensure we have all items
          try {
            final fullOrder = await _apiService.getOrder(order.idOrder!);
            if (fullOrder != null) {
              _allOrders[existingIndex] = fullOrder;
              finalOrder = fullOrder;
            } else {
              // If API call fails, just update with notification data
              _allOrders[existingIndex] = order;
              finalOrder = order;
            }
          } catch (e) {
            // If API call fails, just update with notification data
            _allOrders[existingIndex] = order;
            finalOrder = order;
          }
        } else {
          // New order, fetch full details from API to ensure we have all items
          try {
            final fullOrder = await _apiService.getOrder(order.idOrder!);
            if (fullOrder != null) {
              _allOrders.insert(0, fullOrder);
              finalOrder = fullOrder;
            } else {
              // If API call fails, use notification data
              _allOrders.insert(0, order);
              finalOrder = order;
            }
          } catch (e) {
            // If API call fails, use notification data
            _allOrders.insert(0, order);
            finalOrder = order;
          }
        }

        // Sắp xếp lại danh sách theo thời gian mới nhất
        _allOrders.sort((a, b) {
          if (a.orderTime == null && b.orderTime == null) return 0;
          if (a.orderTime == null) return 1;
          if (b.orderTime == null) return -1;
          return b.orderTime!.compareTo(a.orderTime!);
        });

        // Show notification alert
        _showNewOrderNotification(finalOrder);

        // Play notification sound and announce
        _playNotificationSound();
        try {
          _speechService.announceNewOrder(
            orderId: finalOrder.idOrder!,
            tableNumber: finalOrder.tableNumber,
            location: finalOrder.location,
            totalAmount: finalOrder.totalAmount,
          );
        } catch (e) {
          // Error announcing new order, continue anyway
        }

        notifyListeners();
      } else if (notification.isOrderUpdated) {
        // Update existing order
        final updatedOrder = Order.fromJson(notification.order);

        if (updatedOrder.idOrder == null) {
          return;
        }

        final index = _allOrders.indexWhere(
          (order) => order.idOrder == updatedOrder.idOrder,
        );

        if (index >= 0) {
          // Fetch full order details from API to ensure we have all items
          try {
            final fullOrder = await _apiService.getOrder(updatedOrder.idOrder!);
            if (fullOrder != null) {
              _allOrders[index] = fullOrder;
            } else {
              // If API call fails, use notification data
              _allOrders[index] = updatedOrder;
            }
          } catch (e) {
            // If API call fails, use notification data
            _allOrders[index] = updatedOrder;
          }

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
    } catch (e) {
      // Don't rethrow, just continue
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

  // Refresh orders manually
  Future<void> refreshOrders() async {
    await _loadOrders();
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
    // Cancel subscriptions
    _orderNotificationSubscription?.cancel();
    _connectionStatusSubscription?.cancel();
    _orderNotificationSubscription = null;
    _connectionStatusSubscription = null;

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
    // Cancel subscriptions
    _orderNotificationSubscription?.cancel();
    _connectionStatusSubscription?.cancel();
    _orderNotificationSubscription = null;
    _connectionStatusSubscription = null;

    _webSocketService.disconnect();
    super.dispose();
  }
}
