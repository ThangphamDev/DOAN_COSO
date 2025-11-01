import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/staff_provider.dart';
import '../../models/order.dart';
import '../../utils/app_theme.dart';
import '../../widgets/staff_order_card.dart';
import '../../widgets/loading_widget.dart';

class OrdersManagementScreen extends StatefulWidget {
  const OrdersManagementScreen({super.key});

  @override
  State<OrdersManagementScreen> createState() => _OrdersManagementScreenState();
}

class _OrdersManagementScreenState extends State<OrdersManagementScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _searchQuery = '';
  String _sortBy = 'time'; // time, table, amount
  bool _showFilters = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    // Auto refresh every 30 seconds
    _startAutoRefresh();
  }

  void _startAutoRefresh() {
    Future.delayed(const Duration(seconds: 30), () {
      if (mounted) {
        final staffProvider = Provider.of<StaffProvider>(
          context,
          listen: false,
        );
        staffProvider.refreshOrders();
        _startAutoRefresh();
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  List<Order> _filterAndSortOrders(List<Order> orders) {
    var filtered = orders;

    // Search filter
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((order) {
        final idMatch =
            order.idOrder?.toString().toLowerCase().contains(
              _searchQuery.toLowerCase(),
            ) ??
            false;
        final tableMatch =
            order.tableNumber?.toString().contains(_searchQuery) ?? false;
        return idMatch || tableMatch;
      }).toList();
    }

    // Sort
    switch (_sortBy) {
      case 'time':
        filtered.sort(
          (a, b) => (b.orderTime ?? DateTime.now()).compareTo(
            a.orderTime ?? DateTime.now(),
          ),
        );
        break;
      case 'table':
        filtered.sort((a, b) {
          final tableA = a.tableNumber ?? '';
          final tableB = b.tableNumber ?? '';
          // Try to compare as numbers first, fallback to string comparison
          final numA = int.tryParse(tableA.toString());
          final numB = int.tryParse(tableB.toString());
          if (numA != null && numB != null) {
            return numA.compareTo(numB);
          }
          return tableA.toString().compareTo(tableB.toString());
        });
        break;
      case 'amount':
        filtered.sort(
          (a, b) => (b.totalAmount ?? 0).compareTo(a.totalAmount ?? 0),
        );
        break;
    }

    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text(
          'Quản lý đơn hàng',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          // Filter button
          IconButton(
            icon: Icon(
              _showFilters ? Icons.filter_alt : Icons.filter_alt_outlined,
            ),
            onPressed: () {
              setState(() {
                _showFilters = !_showFilters;
              });
            },
            tooltip: 'Bộ lọc',
          ),
          // Refresh button
          Consumer<StaffProvider>(
            builder: (context, staffProvider, child) {
              return IconButton(
                icon: staffProvider.isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.refresh),
                onPressed: staffProvider.isLoading
                    ? null
                    : staffProvider.refreshOrders,
                tooltip: 'Làm mới',
              );
            },
          ),
          const SizedBox(width: 8),
        ],
        bottom: PreferredSize(
          preferredSize: Size.fromHeight(_showFilters ? 160 : 48),
          child: Column(
            children: [
              // Search bar (always visible)
              if (_showFilters)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  color: AppTheme.primaryColor,
                  child: Column(
                    children: [
                      // Search field
                      TextField(
                        onChanged: (value) {
                          setState(() {
                            _searchQuery = value;
                          });
                        },
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          hintText: 'Tìm kiếm theo mã đơn hoặc bàn...',
                          hintStyle: const TextStyle(color: Colors.white70),
                          prefixIcon: const Icon(
                            Icons.search,
                            color: Colors.white70,
                          ),
                          suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(
                                    Icons.clear,
                                    color: Colors.white70,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _searchQuery = '';
                                    });
                                  },
                                )
                              : null,
                          filled: true,
                          fillColor: Colors.white.withOpacity(0.2),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      // Sort options
                      Row(
                        children: [
                          const Text(
                            'Sắp xếp:',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Row(
                                children: [
                                  _buildSortChip('Thời gian', 'time'),
                                  const SizedBox(width: 8),
                                  _buildSortChip('Số bàn', 'table'),
                                  const SizedBox(width: 8),
                                  _buildSortChip('Tổng tiền', 'amount'),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              // Tabs
              TabBar(
                controller: _tabController,
                labelColor: Colors.white,
                unselectedLabelColor: Colors.white70,
                indicatorColor: Colors.white,
                indicatorWeight: 3,
                labelStyle: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
                unselectedLabelStyle: const TextStyle(
                  fontWeight: FontWeight.normal,
                  fontSize: 14,
                ),
                isScrollable: true,
                tabs: [
                  _buildTabWithBadge('Mới', Icons.fiber_new, 'processing'),
                  _buildTabWithBadge('Chế biến', Icons.restaurant, 'preparing'),
                  _buildTabWithBadge(
                    'Sẵn sàng',
                    Icons.check_circle_outline,
                    'ready',
                  ),
                  _buildTabWithBadge(
                    'Gửi món',
                    Icons.delivery_dining,
                    'completed',
                  ),
                  _buildTabWithBadge(
                    'Đã hủy',
                    Icons.cancel_outlined,
                    'cancelled',
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
      body: Consumer<StaffProvider>(
        builder: (context, staffProvider, child) {
          if (staffProvider.isLoading && staffProvider.allOrders.isEmpty) {
            return const LoadingWidget(message: 'Đang tải đơn hàng...');
          }

          return Column(
            children: [
              // Stats summary bar
              _buildStatsBar(staffProvider),
              // Orders list
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildOrdersList(
                      _filterAndSortOrders(
                        staffProvider.getOrdersByStatus('processing'),
                      ),
                      'processing',
                    ),
                    _buildOrdersList(
                      _filterAndSortOrders(
                        staffProvider.getOrdersByStatus('preparing'),
                      ),
                      'preparing',
                    ),
                    _buildOrdersList(
                      _filterAndSortOrders(
                        staffProvider.getOrdersByStatus('ready'),
                      ),
                      'ready',
                    ),
                    _buildOrdersList(
                      _filterAndSortOrders(
                        staffProvider.getOrdersByStatus('completed'),
                      ),
                      'completed',
                    ),
                    _buildOrdersList(
                      _filterAndSortOrders(
                        staffProvider.getOrdersByStatus('cancelled'),
                      ),
                      'cancelled',
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
      // Quick action button
      floatingActionButton: Consumer<StaffProvider>(
        builder: (context, staffProvider, child) {
          final processingOrders = staffProvider.getOrdersByStatus(
            'processing',
          );
          if (processingOrders.isEmpty) return const SizedBox.shrink();

          return FloatingActionButton.extended(
            onPressed: () => _showBulkActionsDialog(processingOrders),
            backgroundColor: AppTheme.primaryColor,
            icon: const Icon(Icons.playlist_add_check),
            label: Text('Xử lý ${processingOrders.length} đơn'),
          );
        },
      ),
    );
  }

  Widget _buildSortChip(String label, String value) {
    final isSelected = _sortBy == value;
    return FilterChip(
      label: Text(
        label,
        style: TextStyle(
          color: isSelected ? AppTheme.primaryColor : Colors.white,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _sortBy = value;
        });
      },
      backgroundColor: Colors.white.withOpacity(0.2),
      selectedColor: Colors.white,
      checkmarkColor: AppTheme.primaryColor,
      side: BorderSide.none,
    );
  }

  Widget _buildTabWithBadge(String text, IconData icon, String status) {
    return Consumer<StaffProvider>(
      builder: (context, staffProvider, child) {
        final count = staffProvider.getOrdersByStatus(status).length;
        return Tab(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 18),
              const SizedBox(width: 6),
              Text(text),
              if (count > 0) ...[
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    count.toString(),
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatsBar(StaffProvider staffProvider) {
    final processing = staffProvider.getOrdersByStatus('processing').length;
    final preparing = staffProvider.getOrdersByStatus('preparing').length;
    final ready = staffProvider.getOrdersByStatus('ready').length;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildStatItem(
              'Chờ xử lý',
              processing.toString(),
              Icons.pending_outlined,
              Colors.orange,
            ),
          ),
          Container(width: 1, height: 40, color: Colors.grey.shade300),
          Expanded(
            child: _buildStatItem(
              'Đang làm',
              preparing.toString(),
              Icons.restaurant_menu,
              Colors.blue,
            ),
          ),
          Container(width: 1, height: 40, color: Colors.grey.shade300),
          Expanded(
            child: _buildStatItem(
              'Sẵn sàng',
              ready.toString(),
              Icons.check_circle,
              Colors.green,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(width: 6),
            Text(
              value,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade600,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildOrdersList(List<Order> orders, String status) {
    if (orders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _getStatusIcon(status),
              size: 80,
              color: AppTheme.textSecondary.withOpacity(0.5),
            ),
            const SizedBox(height: 20),
            Text(
              _getEmptyMessage(status),
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _getEmptySubMessage(status),
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.textSecondary.withOpacity(0.7),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        final staffProvider = Provider.of<StaffProvider>(
          context,
          listen: false,
        );
        await staffProvider.refreshOrders();
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: orders.length,
        itemBuilder: (context, index) {
          final order = orders[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _buildEnhancedOrderCard(order),
          );
        },
      ),
    );
  }

  Widget _buildEnhancedOrderCard(Order order) {
    return Card(
      elevation: 2,
      shadowColor: Colors.black.withOpacity(0.1),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => _showOrderDetails(order),
        child: StaffOrderCard(
          order: order,
          onStatusUpdate: (newStatus) {
            final staffProvider = Provider.of<StaffProvider>(
              context,
              listen: false,
            );
            staffProvider.updateOrderStatus(order.idOrder!, newStatus);
            _showSnackbar('Đã cập nhật trạng thái đơn hàng');
          },
        ),
      ),
    );
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'processing':
        return Icons.pending_actions;
      case 'preparing':
        return Icons.restaurant;
      case 'ready':
        return Icons.check_circle_outline;
      case 'completed':
        return Icons.delivery_dining;
      case 'cancelled':
        return Icons.cancel_outlined;
      default:
        return Icons.receipt_long_outlined;
    }
  }

  String _getEmptyMessage(String status) {
    switch (status) {
      case 'processing':
        return 'Không có đơn hàng mới';
      case 'preparing':
        return 'Không có đơn đang chế biến';
      case 'ready':
        return 'Không có đơn sẵn sàng';
      case 'completed':
        return 'Chưa có đơn hoàn thành';
      case 'cancelled':
        return 'Không có đơn bị hủy';
      default:
        return 'Không có đơn hàng';
    }
  }

  String _getEmptySubMessage(String status) {
    switch (status) {
      case 'processing':
        return 'Đơn hàng mới sẽ xuất hiện ở đây';
      case 'preparing':
        return 'Bắt đầu chế biến đơn hàng mới';
      case 'ready':
        return 'Đơn hàng hoàn thành sẽ hiển thị ở đây';
      case 'completed':
        return 'Đơn đã gửi món sẽ xuất hiện ở đây';
      case 'cancelled':
        return 'Đơn hàng bị hủy sẽ hiển thị ở đây';
      default:
        return 'Hệ thống đang chờ đơn hàng mới';
    }
  }

  void _showOrderDetails(Order order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.95,
        minChildSize: 0.5,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Content
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Chi tiết đơn hàng',
                        style: Theme.of(context).textTheme.headlineSmall
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Mã đơn: ${order.idOrder ?? "N/A"}',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(height: 24),
                      // Order info would go here
                      // Add more details as needed from order object
                      Center(
                        child: Text(
                          'Thông tin chi tiết đơn hàng',
                          style: TextStyle(color: Colors.grey.shade600),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showBulkActionsDialog(List<Order> orders) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.playlist_add_check, color: AppTheme.primaryColor),
            const SizedBox(width: 12),
            const Text('Xử lý hàng loạt'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.restaurant, color: Colors.blue),
              title: const Text('Chuyển tất cả sang chế biến'),
              onTap: () {
                Navigator.pop(context);
                _bulkUpdateStatus(orders, 'preparing');
              },
            ),
            ListTile(
              leading: const Icon(Icons.check_circle, color: Colors.green),
              title: const Text('Đánh dấu tất cả sẵn sàng'),
              onTap: () {
                Navigator.pop(context);
                _bulkUpdateStatus(orders, 'ready');
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  void _bulkUpdateStatus(List<Order> orders, String newStatus) {
    final staffProvider = Provider.of<StaffProvider>(context, listen: false);

    for (var order in orders) {
      staffProvider.updateOrderStatus(order.idOrder!, newStatus);
    }

    _showSnackbar('Đã cập nhật ${orders.length} đơn hàng');
  }

  void _showSnackbar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 2),
      ),
    );
  }
}
