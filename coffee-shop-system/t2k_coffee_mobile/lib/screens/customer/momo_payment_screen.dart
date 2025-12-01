import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../utils/app_theme.dart';

class MoMoPaymentScreen extends StatefulWidget {
  final String payUrl;
  final int orderId;
  final Function(bool success, int orderId)? onPaymentComplete;
  final String? userRole;

  const MoMoPaymentScreen({
    super.key,
    required this.payUrl,
    required this.orderId,
    this.onPaymentComplete,
    this.userRole,
  });

  @override
  State<MoMoPaymentScreen> createState() => _MoMoPaymentScreenState();
}

class _MoMoPaymentScreenState extends State<MoMoPaymentScreen>
    with WidgetsBindingObserver {
  WebViewController? _controller;
  bool _isLoading = true;
  String? _error;
  bool _hasLaunchedMoMoApp = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    // Nếu là staff/admin, mở trực tiếp trên browser thay vì WebView
    if (!_shouldLaunchMoMoApp()) {
      _openInBrowser();
    } else {
      _initializeWebView();
    }
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
      // Đóng WebView và trả orderId về checkout screen để check payment status
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          try {
            // Trả orderId về để checkout screen có thể check payment status
            Navigator.of(context).pop(widget.orderId);
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
            // ✅ HANDLE RETURN URL NGAY TẠI ĐÂY - Prevent load trang JSON
            if (url.contains('/api/momo/return')) {
              final uri = Uri.parse(url);
              final resultCode = uri.queryParameters['resultCode'];

              // Nếu thanh toán thành công, đóng WebView ngay
              if (resultCode == '0') {
                _handlePaymentReturnAndCloseWebView(url);
              }
              return; // Không set loading state
            }

            // Chỉ set loading nếu không phải return URL và chưa launch MoMo app
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

            // ✅ CHECK RETURN URL TRƯỚC TIÊN - Prevent load trang JSON
            // Nếu là return URL, LUÔN prevent navigation và đóng WebView ngay
            if (url.contains('/api/momo/return')) {
              final uri = Uri.parse(url);
              final resultCode = uri.queryParameters['resultCode'];

              // Nếu thanh toán thành công (resultCode = 0), đóng WebView ngay
              if (resultCode == '0') {
                // Đóng WebView ngay lập tức - KHÔNG CHO load trang JSON
                _handlePaymentReturnAndCloseWebView(url);
              }
              // LUÔN prevent navigation để không load trang JSON
              return NavigationDecision.prevent;
            }

            // Handle intent:// URLs - MoMo app deep links
            // Chỉ mở app MoMo nếu là CUSTOMER, các role khác (STAFF, ADMIN) chỉ xem QR
            if (url.startsWith('intent://')) {
              if (_shouldLaunchMoMoApp()) {
                _handleIntentUrl(url);
              }
              return NavigationDecision
                  .prevent; // Prevent WebView from trying to load intent://
            }

            // Handle other special schemes
            // Chỉ mở app MoMo nếu là CUSTOMER
            if (url.startsWith('momo://')) {
              if (_shouldLaunchMoMoApp()) {
                _launchUrl(url);
              }
              return NavigationDecision.prevent;
            }

            if (url.startsWith('tel://') || url.startsWith('sms://')) {
              _launchUrl(url);
              return NavigationDecision.prevent;
            }

            // ✅ CRITICAL: Block external HTTP/HTTPS URLs nếu không phải từ MoMo domain
            // Điều này giúp prevent việc mở browser ngoài cho return URL
            if ((url.startsWith('http://') || url.startsWith('https://')) &&
                !url.contains('momo.vn') &&
                !url.contains('/api/momo/') &&
                url.contains('resultCode')) {
              // Có thể là return URL được redirect - prevent và handle
              if (url.contains('/api/momo/return')) {
                _handlePaymentReturnAndCloseWebView(url);
              }
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
            // ✅ KHÔNG CẦN XỬ LÝ - onNavigationRequest đã prevent và handle rồi
            // Giữ lại callback này để monitor nếu cần debug
            if (change.url != null &&
                change.url!.contains('/api/momo/return')) {
              // onNavigationRequest đã xử lý, không làm gì thêm
              return;
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

  /// Check if user should be allowed to launch MoMo app
  /// Returns true only for CUSTOMER role, false for STAFF/ADMIN roles
  bool _shouldLaunchMoMoApp() {
    // Nếu không truyền role hoặc là CUSTOMER thì cho phép mở app
    if (widget.userRole == null || widget.userRole == 'CUSTOMER') {
      return true;
    }
    // Các role khác (ADMIN, STAFF_ORDER, STAFF_KITCHEN, STAFF_MANAGER) chỉ xem QR
    return false;
  }

  /// Mở trang thanh toán MoMo trên browser ngoài cho staff/admin
  Future<void> _openInBrowser() async {
    try {
      setState(() {
        _hasLaunchedMoMoApp = true;
        _isLoading = false;
      });

      final uri = Uri.parse(widget.payUrl);

      // Mở browser với mode externalApplication
      final launched = await launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
      );

      if (!launched) {
        throw Exception('Không thể mở browser');
      }

      // Hiển thị thông báo
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(
              'Đã mở trang thanh toán trên browser. Sau khi thanh toán xong, vui lòng quay lại app.',
            ),
            duration: const Duration(seconds: 5),
            backgroundColor: AppTheme.primaryColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Không thể mở browser: $e';
          _isLoading = false;
        });
      }
    }
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

      // Đóng WebView ngay lập tức và trả orderId về checkout screen
      // Checkout screen sẽ xử lý việc check payment status và navigate
      Future.microtask(() {
        if (mounted) {
          Navigator.of(context).pop(orderIdInt);
        }
      });
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
    return PopScope(
      canPop: false, // Chặn back button mặc định
      onPopInvokedWithResult: (didPop, result) async {
        if (!didPop && !_hasLaunchedMoMoApp) {
          // User nhấn back button khi chưa launch MoMo app
          print('[MoMoPayment] User cancelled payment via back button');
          Navigator.of(context).pop(-1); // Trả về -1 để signal CANCEL
        }
      },
      child: Scaffold(
        backgroundColor: AppTheme.backgroundColor,
        appBar: AppBar(
          title: Text(
            _shouldLaunchMoMoApp() ? 'Thanh toán MoMo' : 'Quét mã QR MoMo',
          ),
          backgroundColor: AppTheme.primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
          automaticallyImplyLeading:
              !_hasLaunchedMoMoApp, // Ẩn nút back khi đã launch MoMo app
          leading: !_hasLaunchedMoMoApp
              ? IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () {
                    // Trả về -1 để signal CANCEL
                    Navigator.of(context).pop(-1);
                  },
                )
              : null,
        ),
        body: Stack(
          children: [
            // Hiển thị WebView nếu chưa launch MoMo app
            if (!_hasLaunchedMoMoApp)
              if (_error != null)
                _buildErrorScreen()
              else
                Column(
                  children: [
                    // Hiển thị banner hướng dẫn cho staff/admin
                    if (!_shouldLaunchMoMoApp())
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withOpacity(0.1),
                          border: Border(
                            bottom: BorderSide(
                              color: AppTheme.primaryColor.withOpacity(0.3),
                              width: 1,
                            ),
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.qr_code_scanner,
                              color: AppTheme.primaryColor,
                              size: 24,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'Vui lòng quét mã QR bên dưới bằng ứng dụng MoMo trên điện thoại khách hàng',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: AppTheme.primaryColor,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    if (_controller != null)
                      Expanded(child: WebViewWidget(controller: _controller!)),
                  ],
                ),

            // ✅ Overlay chờ xác nhận khi đã launch MoMo app/browser
            if (_hasLaunchedMoMoApp)
              Container(
                color: Colors.white,
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          _shouldLaunchMoMoApp()
                              ? Icons.phone_android
                              : Icons.open_in_browser,
                          size: 64,
                          color: AppTheme.primaryColor,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _shouldLaunchMoMoApp()
                              ? 'Đang chờ xác nhận từ MoMo...'
                              : 'Đang chờ thanh toán trên browser...',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w500,
                            color: AppTheme.textPrimary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _shouldLaunchMoMoApp()
                              ? 'Vui lòng hoàn tất thanh toán trên ứng dụng MoMo'
                              : 'Vui lòng hoàn tất thanh toán trên browser.\nSau khi thanh toán xong, quay lại app để tiếp tục.',
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppTheme.textSecondary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 24),
                        const CircularProgressIndicator(
                          valueColor: AlwaysStoppedAnimation<Color>(
                            AppTheme.primaryColor,
                          ),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: () {
                            Navigator.of(context).pop(widget.orderId);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryColor,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 32,
                              vertical: 12,
                            ),
                          ),
                          child: const Text('Đã thanh toán - Kiểm tra ngay'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

            // Loading indicator cho WebView
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
          ],
        ),
      ), // Close Scaffold
    ); // Close PopScope
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
              _controller?.reload();
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
