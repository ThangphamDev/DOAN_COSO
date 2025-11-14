import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../utils/app_theme.dart';
import '../../services/api_service.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';

class MoMoPaymentScreen extends StatefulWidget {
  final String payUrl;
  final int orderId;
  final Function(bool success, int orderId)? onPaymentComplete;

  const MoMoPaymentScreen({
    super.key,
    required this.payUrl,
    required this.orderId,
    this.onPaymentComplete,
  });

  @override
  State<MoMoPaymentScreen> createState() => _MoMoPaymentScreenState();
}

class _MoMoPaymentScreenState extends State<MoMoPaymentScreen>
    with WidgetsBindingObserver {
  late final WebViewController _controller;
  bool _isLoading = true;
  String? _error;
  final ApiService _apiService = ApiService();
  int? _successOrderId;
  bool _isCheckingStatus = false;
  bool _hasLaunchedMoMoApp = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeWebView();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    // Khi app resume (người dùng quay lại từ MoMo app/browser)
    if (state == AppLifecycleState.resumed && _hasLaunchedMoMoApp && mounted) {
      // Đóng WebView ngay nếu vẫn đang mở
      // Logic check payment status sẽ được xử lý bởi checkout_screen
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          // Đóng WebView (có thể đã đóng rồi, nhưng không sao)
          try {
            Navigator.of(context).pop();
          } catch (e) {
            // WebView đã đóng rồi, không sao
          }
        }
      });
    }
  }

  void _initializeWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setUserAgent(
        'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      )
      ..setBackgroundColor(Colors.white)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            // Check if this is the return URL - đóng WebView ngay TRƯỚC khi set loading
            if (url.contains('/api/momo/return')) {
              final uri = Uri.parse(url);
              final resultCode = uri.queryParameters['resultCode'];
              if (resultCode == '0' && !_hasLaunchedMoMoApp) {
                // Đóng WebView ngay - không cho load trang JSON
                // Không set loading state vì sẽ đóng ngay
                _handlePaymentReturnAndCloseWebView(url);
                return; // Không set loading state
              }
            }

            // Chỉ set loading nếu không phải return URL
            if (!_hasLaunchedMoMoApp) {
              setState(() {
                _isLoading = true;
                _error = null; // Clear error when starting new page
              });
            }
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
          },
          onNavigationRequest: (NavigationRequest request) {
            final url = request.url;

            // Nếu đã launch MoMo app, không cho navigate nữa
            if (_hasLaunchedMoMoApp) {
              return NavigationDecision.prevent;
            }

            // Nếu là return URL với resultCode = '0', prevent navigation và đóng WebView ngay
            // Phải check TRƯỚC các scheme khác để đóng ngay
            if (url.contains('/api/momo/return')) {
              final uri = Uri.parse(url);
              final resultCode = uri.queryParameters['resultCode'];
              if (resultCode == '0' && !_hasLaunchedMoMoApp) {
                // Đóng WebView ngay lập tức - prevent load trang JSON
                _handlePaymentReturnAndCloseWebView(url);
                return NavigationDecision.prevent;
              }
            }

            // Handle intent:// URLs - MoMo app deep links
            if (url.startsWith('intent://')) {
              _handleIntentUrl(url);
              return NavigationDecision
                  .prevent; // Prevent WebView from trying to load intent://
            }

            // Handle other special schemes
            if (url.startsWith('momo://') ||
                url.startsWith('tel://') ||
                url.startsWith('sms://')) {
              _launchUrl(url);
              return NavigationDecision.prevent;
            }

            // Allow all other navigation - important for MoMo payment flow
            return NavigationDecision.navigate;
          },
          onWebResourceError: (WebResourceError error) {
            setState(() {
              _isLoading = false;
              // Only show error if it's not ORB error (which might be handled)
              if (!error.description.contains('ERR_BLOCKED_BY_ORB') &&
                  !error.description.contains('net::ERR')) {
                _error = error.description;
              } else {
                // For ORB errors, try to continue - MoMo might still work
                _error = null;
              }
            });
          },
          onUrlChange: (UrlChange change) {
            if (change.url != null) {
              // Check if this is the return URL
              if (change.url!.contains('/api/momo/return')) {
                final uri = Uri.parse(change.url!);
                final resultCode = uri.queryParameters['resultCode'];
                // Nếu payment thành công, đóng WebView ngay
                if (resultCode == '0' && !_hasLaunchedMoMoApp) {
                  _handlePaymentReturnAndCloseWebView(change.url!);
                }
              }
            }
          },
        ),
      )
      ..addJavaScriptChannel(
        'PaymentCallback',
        onMessageReceived: (JavaScriptMessage message) {
          _handlePaymentCallback(message.message);
        },
      )
      ..loadRequest(
        Uri.parse(widget.payUrl),
        headers: {
          'User-Agent':
              'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        },
      );
  }

  void _handlePaymentReturnAndCloseWebView(String url) {
    // Parse URL parameters
    final uri = Uri.parse(url);
    final resultCode = uri.queryParameters['resultCode'];
    final orderId = uri.queryParameters['orderId'];

    // Double check để tránh gọi nhiều lần
    if (resultCode != null && resultCode == '0' && !_hasLaunchedMoMoApp) {
      final orderIdInt = int.tryParse(orderId ?? '') ?? widget.orderId;

      // Set flag ngay lập tức để prevent navigation và mở browser ngoài
      _hasLaunchedMoMoApp = true;
      _successOrderId = orderIdInt;

      // Đóng WebView ngay lập tức - không đợi async
      // Đóng ngay để prevent WebView load trang JSON
      // Sử dụng Future.microtask để đảm bảo đóng ngay trong microtask queue
      Future.microtask(() {
        if (mounted) {
          Navigator.of(context).pop(orderIdInt);
        }
      });
    }
  }

  Future<void> _checkPaymentStatusAndNavigate() async {
    if (_isCheckingStatus) return;

    // Ưu tiên _successOrderId, nếu null thì dùng widget.orderId
    final orderIdToCheck = _successOrderId ?? widget.orderId;

    setState(() {
      _isCheckingStatus = true;
    });

    try {
      // Polling backend để kiểm tra payment status
      int checkCount = 0;
      const maxChecks = 15; // Tối đa 15 lần (30 giây)
      bool paymentCompleted = false;

      while (checkCount < maxChecks && !paymentCompleted && mounted) {
        await Future.delayed(const Duration(seconds: 2));

        try {
          final statusResponse = await _apiService.checkMoMoPaymentStatus(
            orderIdToCheck,
          );
          final paymentStatus = statusResponse['paymentStatus'] as String?;
          final orderStatus = statusResponse['orderStatus'] as String?;

          if (paymentStatus == 'completed' && orderStatus == 'processing') {
            paymentCompleted = true;
            break;
          }
        } catch (e) {
          // Log error but continue polling
          print('Error checking MoMo payment status: $e');
        }

        checkCount++;
      }

      if (!mounted) return;

      setState(() {
        _isCheckingStatus = false;
      });

      if (paymentCompleted) {
        // Lưu orderId để navigate
        _successOrderId = orderIdToCheck;
        // Navigate to order success screen (WebView đã đóng ở didChangeAppLifecycleState)
        await _navigateToOrderSuccess();
      } else {
        // Nếu chưa cập nhật, vẫn hiển thị thông báo và cho phép xem đơn hàng
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Đang kiểm tra trạng thái thanh toán. Vui lòng đợi trong giây lát...',
              ),
              duration: Duration(seconds: 3),
              backgroundColor: AppTheme.primaryColor,
            ),
          );
          // Lưu orderId để navigate
          _successOrderId = orderIdToCheck;
          // Vẫn cho phép xem đơn hàng (WebView đã đóng ở didChangeAppLifecycleState)
          await _navigateToOrderSuccess();
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isCheckingStatus = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi khi kiểm tra trạng thái: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  Future<void> _navigateToOrderSuccess() async {
    // Dùng _successOrderId nếu có, nếu không thì dùng widget.orderId
    final orderId = _successOrderId ?? widget.orderId;

    try {
      // Đảm bảo token được load lại trước khi gọi API
      await _apiService.initialize();

      // Get updated order from backend
      final order = await _apiService.getOrder(orderId);

      final cartProvider = Provider.of<CartProvider>(context, listen: false);
      final authProvider = Provider.of<AuthProvider>(context, listen: false);

      // Refresh reward points
      if (authProvider.isLoggedIn &&
          authProvider.currentUser?.idAccount != null) {
        try {
          await authProvider.refreshRewardPoints();
        } catch (e) {
          // Silent fail
        }
      }

      // Clear cart
      cartProvider.clearCart();

      if (mounted) {
        context.push('/customer/order-success', extra: order);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi khi tải thông tin đơn hàng: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  void _handlePaymentCallback(String message) {
    try {
      // Try to parse JSON message
      final data = message;
      // Handle callback from JavaScript
      if (data.contains('status') && data.contains('orderId')) {
        // Extract status and orderId from message
        // This is a simple implementation, you might want to use JSON parsing
        final success = data.contains('success');
        if (widget.onPaymentComplete != null) {
          widget.onPaymentComplete!(success, widget.orderId);
        }
        if (mounted) {
          Navigator.of(context).pop(success);
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  Future<void> _handleIntentUrl(String intentUrl) async {
    try {
      // Parse intent:// URL format
      // Format: intent://host/path?params#Intent;scheme=momo;package=com.mservice.momotransfer;end
      if (intentUrl.startsWith('intent://')) {
        // Extract scheme and package from Intent
        String? scheme;

        // Find #Intent section
        final intentIndex = intentUrl.indexOf('#Intent');
        if (intentIndex != -1) {
          final intentPart = intentUrl.substring(intentIndex);

          // Extract scheme from Intent parameters
          final schemeMatch = RegExp(r'scheme=([^;]+)').firstMatch(intentPart);
          if (schemeMatch != null) {
            scheme = schemeMatch.group(1);
          }

          // Extract the path part (before #Intent)
          final pathPart = intentUrl.substring(
            9,
            intentIndex,
          ); // Remove 'intent://' prefix

          // Build URL with scheme
          if (scheme != null) {
            final url = '$scheme://$pathPart';
            // Đánh dấu là đã mở MoMo app
            _hasLaunchedMoMoApp = true;
            if (mounted) {
              setState(() {}); // Update UI để ẩn nút back
            }
            await _launchUrl(url);
            return;
          }
        }

        // Fallback: try to launch as intent:// directly (Android will handle it)
        final uri = Uri.parse(intentUrl);
        if (await canLaunchUrl(uri)) {
          // Đánh dấu là đã mở MoMo app
          _hasLaunchedMoMoApp = true;
          if (mounted) {
            setState(() {}); // Update UI để ẩn nút back
          }
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        } else {
          throw Exception('Cannot launch intent URL');
        }
      } else {
        await _launchUrl(intentUrl);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Không thể mở ứng dụng MoMo. Vui lòng cài đặt ứng dụng MoMo hoặc thanh toán trên trình duyệt.',
            ),
            backgroundColor: AppTheme.errorColor,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }

  Future<void> _launchUrl(String url) async {
    try {
      final uri = Uri.parse(url);

      // For momo:// and intent:// schemes, try to launch directly
      // canLaunchUrl might return false even if app is installed (Android 11+ package visibility)
      if (url.startsWith('momo://') || url.startsWith('intent://')) {
        try {
          // Đánh dấu là đã mở MoMo app
          _hasLaunchedMoMoApp = true;
          if (mounted) {
            setState(() {}); // Update UI để ẩn nút back
          }
          await launchUrl(uri, mode: LaunchMode.externalApplication);
          // If successful, don't show error
          return;
        } catch (e) {
          // If launch fails, reset flag và show helpful message
          _hasLaunchedMoMoApp = false;
          if (mounted) {
            setState(() {});
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: const Text(
                  'Không thể mở ứng dụng MoMo. Vui lòng cài đặt ứng dụng MoMo hoặc tiếp tục thanh toán trên trình duyệt.',
                ),
                backgroundColor: AppTheme.errorColor,
                duration: const Duration(seconds: 5),
                action: SnackBarAction(
                  label: 'Tiếp tục',
                  textColor: Colors.white,
                  onPressed: () {
                    // User can continue payment in WebView
                  },
                ),
              ),
            );
          }
          return;
        }
      }

      // For other URLs, check first
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Không thể mở URL: $url'),
              backgroundColor: AppTheme.errorColor,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi khi mở URL: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Thanh toán MoMo'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        automaticallyImplyLeading:
            !_hasLaunchedMoMoApp, // Ẩn nút back khi đã launch MoMo app
      ),
      body: Stack(
        children: [
          // Hiển thị WebView nếu chưa launch MoMo app
          if (!_hasLaunchedMoMoApp)
            if (_error != null)
              _buildErrorScreen()
            else
              WebViewWidget(controller: _controller),
          if (_isLoading && _error == null && !_hasLaunchedMoMoApp)
            Container(
              color: Colors.white,
              child: const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(
                    AppTheme.primaryColor,
                  ),
                ),
              ),
            ),
          if (_isCheckingStatus)
            Container(
              color: Colors.black54,
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Đang kiểm tra trạng thái thanh toán...',
                      style: TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildErrorScreen() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, color: AppTheme.errorColor, size: 64),
          const SizedBox(height: 16),
          Text(
            'Lỗi: $_error',
            style: const TextStyle(fontSize: 16, color: AppTheme.textPrimary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _error = null;
              });
              _controller.reload();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              foregroundColor: Colors.white,
            ),
            child: const Text('Thử lại'),
          ),
        ],
      ),
    );
  }
}
