import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:audioplayers/audioplayers.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();
  final AudioPlayer _audioPlayer = AudioPlayer();
  bool _isInitialized = false;

  // Initialize notification service
  Future<void> initialize() async {
    if (_isInitialized) return;

    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Request permissions
    await _requestPermissions();

    _isInitialized = true;
  }

  // Request notification permissions
  Future<void> _requestPermissions() async {
    final androidPlugin = _notifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();

    if (androidPlugin != null) {
      await androidPlugin.requestNotificationsPermission();
    }

    final iosPlugin = _notifications
        .resolvePlatformSpecificImplementation<
          IOSFlutterLocalNotificationsPlugin
        >();

    if (iosPlugin != null) {
      await iosPlugin.requestPermissions(alert: true, badge: true, sound: true);
    }
  }

  // Handle notification tap
  void _onNotificationTapped(NotificationResponse response) {
    // Handle navigation based on payload
  }

  // Show order status notification
  Future<void> showOrderStatusNotification({
    required int orderId,
    required String status,
    String? customerName,
  }) async {
    if (!_isInitialized) {
      await initialize();
    }

    final String title = _getNotificationTitle(status);
    final String body = _getNotificationBody(orderId, status, customerName);

    const androidDetails = AndroidNotificationDetails(
      'order_updates',
      'Cập nhật đơn hàng',
      channelDescription: 'Thông báo về trạng thái đơn hàng',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
      enableVibration: true,
      playSound: true,
      icon: '@mipmap/ic_launcher',
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.show(
      orderId,
      title,
      body,
      details,
      payload: 'order_$orderId',
    );

    // Play notification sound
    await _playNotificationSound(status);
  }

  // Get notification title based on status
  String _getNotificationTitle(String status) {
    switch (status.toLowerCase()) {
      case 'processing':
        return '📋 Đơn hàng đang xử lý';
      case 'preparing':
        return '👨‍🍳 Đang chuẩn bị';
      case 'ready':
        return '✅ Đơn hàng đã sẵn sàng';
      case 'completed':
        return '🎉 Đơn hàng hoàn thành';
      case 'cancelled':
        return '❌ Đơn hàng đã hủy';
      default:
        return '📢 Cập nhật đơn hàng';
    }
  }

  // Get notification body based on status
  String _getNotificationBody(
    int orderId,
    String status,
    String? customerName,
  ) {
    switch (status.toLowerCase()) {
      case 'processing':
        return 'Đơn hàng #$orderId đang được xử lý';
      case 'preparing':
        return 'Đơn hàng #$orderId đang được chuẩn bị';
      case 'ready':
        return 'Đơn hàng #$orderId đã sẵn sàng! Vui lòng đến lấy';
      case 'completed':
        return 'Cảm ơn bạn đã sử dụng dịch vụ! Đơn hàng #$orderId';
      case 'cancelled':
        return 'Đơn hàng #$orderId đã bị hủy';
      default:
        return 'Đơn hàng #$orderId đã được cập nhật';
    }
  }

  // Play notification sound based on status
  Future<void> _playNotificationSound(String status) async {
    try {
      String soundFile;
      switch (status.toLowerCase()) {
        case 'ready':
          soundFile = 'assets/sounds/order_ready.mp3';
          break;
        case 'completed':
          soundFile = 'assets/sounds/success.mp3';
          break;
        case 'cancelled':
          soundFile = 'assets/sounds/error.mp3';
          break;
        default:
          soundFile = 'assets/sounds/notification.mp3';
      }

      await _audioPlayer.play(AssetSource(soundFile));
    } catch (e) {
      // Silent fail for notification sound
    }
  }

  // Show new order notification (for staff)
  Future<void> showNewOrderNotification({
    required int orderId,
    int? tableNumber,
    String? location,
    double? totalAmount,
  }) async {
    if (!_isInitialized) {
      await initialize();
    }

    final String title = '🔔 Đơn hàng mới!';
    final String body = tableNumber != null
        ? 'Đơn hàng #$orderId - Bàn $tableNumber'
        : 'Đơn hàng #$orderId - ${location ?? "Mang đi"}';

    const androidDetails = AndroidNotificationDetails(
      'new_orders',
      'Đơn hàng mới',
      channelDescription: 'Thông báo đơn hàng mới cho nhân viên',
      importance: Importance.max,
      priority: Priority.max,
      showWhen: true,
      enableVibration: true,
      playSound: true,
      icon: '@mipmap/ic_launcher',
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.show(
      orderId + 10000, // Offset to avoid collision
      title,
      body,
      details,
      payload: 'new_order_$orderId',
    );

    // Play new order sound
    try {
      await _audioPlayer.play(AssetSource('assets/sounds/new_order.mp3'));
    } catch (e) {
      // Silent fail for new order sound
    }
  }

  // Cancel notification
  Future<void> cancelNotification(int id) async {
    await _notifications.cancel(id);
  }

  // Cancel all notifications
  Future<void> cancelAllNotifications() async {
    await _notifications.cancelAll();
  }

  // Dispose resources
  void dispose() {
    _audioPlayer.dispose();
  }
}
