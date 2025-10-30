class WebSocketMessage {
  final String? type;
  final dynamic data;
  final String? timestamp;
  final String? userId;
  final String? sessionId;

  WebSocketMessage({
    this.type,
    this.data,
    this.timestamp,
    this.userId,
    this.sessionId,
  });

  factory WebSocketMessage.fromJson(Map<String, dynamic> json) {
    return WebSocketMessage(
      type: json['type'] as String?,
      data: json['data'],
      timestamp: json['timestamp'] as String?,
      userId: json['userId'] as String?,
      sessionId: json['sessionId'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'data': data,
      'timestamp': timestamp,
      'userId': userId,
      'sessionId': sessionId,
    };
  }
}

class OrderNotification {
  final String? notificationType;
  final dynamic order; // Will be parsed as Order object
  final String? message;
  final String? priority;
  final String? timestamp;

  OrderNotification({
    this.notificationType,
    this.order,
    this.message,
    this.priority,
    this.timestamp,
  });

  factory OrderNotification.fromJson(Map<String, dynamic> json) {
    return OrderNotification(
      notificationType: json['notificationType'] as String?,
      order: json['order'],
      message: json['message'] as String?,
      priority: json['priority'] as String?,
      timestamp: json['timestamp'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'notificationType': notificationType,
      'order': order,
      'message': message,
      'priority': priority,
      'timestamp': timestamp,
    };
  }

  bool get isHighPriority => priority?.toUpperCase() == 'HIGH';
  bool get isNewOrder => notificationType == 'NEW_ORDER';
  bool get isOrderUpdated => notificationType == 'ORDER_UPDATED';
  bool get isOrderCompleted => notificationType == 'ORDER_COMPLETED';
  bool get isOrderCancelled => notificationType == 'ORDER_CANCELLED';
}

class WebSocketRegistration {
  final String userId;
  final String userType;
  final String? deviceId;
  final String? deviceName;

  WebSocketRegistration({
    required this.userId,
    required this.userType,
    this.deviceId,
    this.deviceName,
  });

  factory WebSocketRegistration.fromJson(Map<String, dynamic> json) {
    return WebSocketRegistration(
      userId: json['userId'] as String,
      userType: json['userType'] as String,
      deviceId: json['deviceId'] as String?,
      deviceName: json['deviceName'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'userType': userType,
      'deviceId': deviceId,
      'deviceName': deviceName,
    };
  }
}

class WebSocketStats {
  final int? activeStaffCount;
  final int? activeCustomerCount;
  final String? timestamp;

  WebSocketStats({
    this.activeStaffCount,
    this.activeCustomerCount,
    this.timestamp,
  });

  factory WebSocketStats.fromJson(Map<String, dynamic> json) {
    return WebSocketStats(
      activeStaffCount: json['activeStaffCount'] as int?,
      activeCustomerCount: json['activeCustomerCount'] as int?,
      timestamp: json['timestamp'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'activeStaffCount': activeStaffCount,
      'activeCustomerCount': activeCustomerCount,
      'timestamp': timestamp,
    };
  }
}
