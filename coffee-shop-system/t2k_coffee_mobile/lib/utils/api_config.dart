class ApiConfig {
  // Local development URLs
  static const String localBaseUrl = 'http://localhost:8081';
  static const String localWsUrl = 'ws://localhost:8081/ws';

  // Ngrok URLs (update these when ngrok URL changes)
  static const String ngrokBaseUrl =
      'https://gullably-nonpsychological-leisha.ngrok-free.dev';
  static const String ngrokWsUrl =
      'wss://gullably-nonpsychological-leisha.ngrok-free.dev/ws';

  // Use ngrok for mobile testing, local for web testing
  static const bool useNgrok = true;

  static String get baseUrl => useNgrok ? ngrokBaseUrl : localBaseUrl;
  static String get wsUrl => useNgrok ? ngrokWsUrl : localWsUrl;

  // API Endpoints
  static const String loginEndpoint = '/api/accounts/login';
  static const String accountsEndpoint = '/api/accounts';
  static const String productsEndpoint = '/api/products';
  static const String categoriesEndpoint = '/api/categories';
  static const String ordersEndpoint = '/api/orders';
  static const String tablesEndpoint = '/api/tables';
  static const String dashboardEndpoint = '/api/dashboard';
  static const String websocketTestEndpoint = '/api/websocket/test';

  // WebSocket Topics
  static const String staffOrdersTopic = '/topic/staff/orders';
  static const String notificationsTopic = '/topic/notifications';
  static const String userNotificationsQueue = '/queue/notifications';

  // WebSocket App Destinations
  static const String registerDestination = '/app/register';
  static const String disconnectDestination = '/app/disconnect';
  static const String pingDestination = '/app/ping';
  static const String orderStatusDestination = '/app/order/status';
  static const String staffReadyDestination = '/app/staff/ready';
  static const String orderTrackDestination = '/app/order/track';

  // Headers
  static const Map<String, String> defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Timeouts
  static const int connectTimeout = 30000; // 30 seconds
  static const int receiveTimeout = 30000; // 30 seconds
  static const int sendTimeout = 30000; // 30 seconds

  // WebSocket Reconnection
  static const int maxReconnectAttempts = 5;
  static const int reconnectDelayMs = 3000; // 3 seconds
  static const int heartbeatIntervalMs = 30000; // 30 seconds

  // Update ngrok URL helper
  static void updateNgrokUrl(String newUrl) {
    // This would typically be done through a configuration file or environment variable
    // For now, manually update the ngrokBaseUrl constant above
    print('Please update ngrokBaseUrl to: $newUrl');
  }
}
