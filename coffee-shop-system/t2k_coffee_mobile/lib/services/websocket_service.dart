import 'dart:async';
import 'dart:convert';
import 'package:stomp_dart_client/stomp.dart';
import 'package:stomp_dart_client/stomp_config.dart';
import 'package:stomp_dart_client/stomp_frame.dart';
import '../models/websocket_message.dart';
import '../utils/api_config.dart';
import 'api_service.dart';

class WebSocketService {
  static final WebSocketService _instance = WebSocketService._internal();
  factory WebSocketService() => _instance;
  WebSocketService._internal();

  StompClient? _stompClient;
  Timer? _heartbeatTimer;
  Timer? _reconnectTimer;
  int _reconnectAttempts = 0;
  bool _isConnecting = false;
  bool _isConnected = false;
  String? _userId;
  String? _userType;
  String? _deviceId;

  // Stream controllers for different message types
  final StreamController<WebSocketMessage> _messageController =
      StreamController<WebSocketMessage>.broadcast();
  final StreamController<OrderNotification> _orderNotificationController =
      StreamController<OrderNotification>.broadcast();
  final StreamController<String> _connectionStatusController =
      StreamController<String>.broadcast();

  // Getters
  bool get isConnected => _isConnected;
  bool get isConnecting => _isConnecting;
  Stream<WebSocketMessage> get messageStream => _messageController.stream;
  Stream<OrderNotification> get orderNotificationStream =>
      _orderNotificationController.stream;
  Stream<String> get connectionStatusStream =>
      _connectionStatusController.stream;

  // Connect to WebSocket (STOMP)
  Future<bool> connect({
    required String userId,
    required String userType,
    String? deviceId,
  }) async {
    if (_isConnecting || _isConnected) {
      return _isConnected;
    }

    _userId = userId;
    _userType = userType;
    _deviceId = deviceId;
    _isConnecting = true;
    _connectionStatusController.add('connecting');

    try {
      final token = ApiService().token;
      final commonHeaders = <String, String>{
        if (token != null) 'Authorization': 'Bearer $token',
        if (ApiConfig.useNgrok) 'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
      };

      _stompClient = StompClient(
        config: StompConfig(
          url: ApiConfig.wsUrl,
          onConnect: _onStompConnect,
          onWebSocketError: _handleError,
          onStompError: (StompFrame f) => _handleError(f.body ?? 'stomp_error'),
          onDisconnect: (f) => _handleDisconnection(),
          heartbeatOutgoing: Duration(
            milliseconds: ApiConfig.heartbeatIntervalMs,
          ),
          heartbeatIncoming: Duration(
            milliseconds: ApiConfig.heartbeatIntervalMs,
          ),
          reconnectDelay: Duration(milliseconds: ApiConfig.reconnectDelayMs),
          stompConnectHeaders: commonHeaders,
          webSocketConnectHeaders: commonHeaders,
        ),
      );

      _stompClient!.activate();

      // Wait a bit for connect callback
      await Future.delayed(Duration(milliseconds: 800));

      return _isConnected;
    } catch (e) {
      _handleError(e);
    }

    _isConnecting = false;
    _connectionStatusController.add('disconnected');
    return false;
  }

  // Disconnect from WebSocket
  Future<void> disconnect() async {
    _stopHeartbeat();
    _stopReconnectTimer();

    if (_stompClient != null) {
      // Send disconnect message
      await _sendMessage(ApiConfig.disconnectDestination, {
        'userId': _userId,
        'userType': _userType,
      });

      _stompClient!.deactivate();
      _stompClient = null;
    }

    _isConnected = false;
    _isConnecting = false;
    _connectionStatusController.add('disconnected');
  }

  // Handle incoming messages
  void _handleMessage(dynamic message) {
    try {
      final data = message is String ? json.decode(message) : message;
      final wsMessage = WebSocketMessage.fromJson(data);

      _messageController.add(wsMessage);

      // Handle specific message types
      if (wsMessage.data != null) {
        if (wsMessage.type == 'ORDER_NOTIFICATION' ||
            wsMessage.type == 'ORDER_UPDATE' ||
            wsMessage.type == 'ORDER_COMPLETED') {
          final notification = OrderNotification.fromJson(wsMessage.data);
          _orderNotificationController.add(notification);
        }
      }
    } catch (e) {
      print('Error handling WebSocket message: $e');
    }
  }

  // Handle WebSocket errors
  void _handleError(dynamic error) {
    _isConnected = false;
    _isConnecting = false;
    _connectionStatusController.add('error');

    // Attempt to reconnect
    _attemptReconnect();
  }

  // Handle disconnection
  void _handleDisconnection() {
    _isConnected = false;
    _isConnecting = false;
    _connectionStatusController.add('disconnected');

    // Attempt to reconnect
    _attemptReconnect();
  }

  // Attempt to reconnect
  void _attemptReconnect() {
    if (_reconnectAttempts >= ApiConfig.maxReconnectAttempts) {
      _connectionStatusController.add('failed');
      return;
    }

    _stopReconnectTimer();
    _reconnectAttempts++;

    _reconnectTimer = Timer(
      Duration(milliseconds: ApiConfig.reconnectDelayMs * _reconnectAttempts),
      () {
        if (_userId != null && _userType != null) {
          connect(userId: _userId!, userType: _userType!, deviceId: _deviceId);
        }
      },
    );
  }

  // Register user with server via STOMP and subscribe to topics
  Future<void> _registerUserAndSubscribe() async {
    if (_userId != null && _userType != null) {
      await _sendMessage(ApiConfig.registerDestination, {
        'userId': _userId,
        'userType': _userType,
        'deviceId': _deviceId,
      });

      // Subscribe using STOMP
      if (_stompClient != null) {
        if (_userType == 'STAFF' || _userType == 'ADMIN') {
          _stompClient!.subscribe(
            destination: ApiConfig.staffOrdersTopic,
            callback: (frame) => _handleMessage(frame.body),
          );
        } else if (_userType == 'CUSTOMER') {
          // Subscribe to customer-specific topic broadcasted by backend
          _stompClient!.subscribe(
            destination: '/topic/customer/' + _userId! + '/orders',
            callback: (frame) => _handleMessage(frame.body),
          );
        }
        // Optionally subscribe to global notifications if used
        _stompClient!.subscribe(
          destination: ApiConfig.notificationsTopic,
          callback: (frame) => _handleMessage(frame.body),
        );
      }
    }
  }

  // Send message to server
  Future<void> _sendMessage(
    String destination,
    Map<String, dynamic> data,
  ) async {
    if (_stompClient != null && _isConnected) {
      try {
        final message = json.encode(data);
        _stompClient!.send(destination: destination, body: message);
      } catch (e) {
        print('Error sending WebSocket message: $e');
      }
    }
  }

  // Start heartbeat
  void _startHeartbeat() {
    _stopHeartbeat();
    _heartbeatTimer = Timer.periodic(
      Duration(milliseconds: ApiConfig.heartbeatIntervalMs),
      (timer) {
        if (_isConnected) {
          _sendMessage(ApiConfig.pingDestination, {
            'timestamp': DateTime.now().millisecondsSinceEpoch,
          });
        }
      },
    );
  }

  // Stop heartbeat
  void _stopHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
  }

  // Stop reconnect timer
  void _stopReconnectTimer() {
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
  }

  // Send order status update (for staff)
  Future<void> updateOrderStatus(int orderId, String status) async {
    await _sendMessage(ApiConfig.orderStatusDestination, {
      'orderId': orderId,
      'status': status,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }

  // Send staff ready notification
  Future<void> notifyStaffReady(String staffName) async {
    await _sendMessage(ApiConfig.staffReadyDestination, {
      'staffId': _userId,
      'staffName': staffName,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }

  // Request order tracking (for customers)
  Future<void> trackOrder(int orderId) async {
    await _sendMessage(ApiConfig.orderTrackDestination, {
      'orderId': orderId,
      'customerId': _userId,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }

  // Dispose resources
  void dispose() {
    disconnect();
    _messageController.close();
    _orderNotificationController.close();
    _connectionStatusController.close();
  }

  // STOMP onConnect callback
  void _onStompConnect(StompFrame frame) async {
    _isConnected = true;
    _isConnecting = false;
    _reconnectAttempts = 0;
    _connectionStatusController.add('connected');
    await _registerUserAndSubscribe();
    _startHeartbeat();
  }
}
