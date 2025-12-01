import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/table.dart';
import '../../services/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../utils/app_theme.dart';

class TableManagementScreen extends StatefulWidget {
  const TableManagementScreen({super.key});

  @override
  State<TableManagementScreen> createState() => _TableManagementScreenState();
}

class _TableManagementScreenState extends State<TableManagementScreen> {
  final ApiService _apiService = ApiService();
  List<CafeTable> _tables = [];
  List<CafeTable> _filteredTables = [];
  bool _isLoading = true;
  String _selectedArea = 'all';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadTables();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadTables() async {
    setState(() => _isLoading = true);
    try {
      final tables = await _apiService.getTables();
      setState(() {
        _tables = tables;
        _filteredTables = tables;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Lỗi tải dữ liệu: $e')));
      }
    }
  }

  void _filterTables() {
    setState(() {
      _filteredTables = _tables.where((table) {
        // Filter by area
        final matchesArea =
            _selectedArea == 'all' ||
            table.location?.toLowerCase() == _selectedArea.toLowerCase();

        // Filter by search
        final searchQuery = _searchController.text.toLowerCase();
        final matchesSearch =
            searchQuery.isEmpty ||
            table.tableNumber.toString().contains(searchQuery) ||
            (table.location?.toLowerCase().contains(searchQuery) ?? false);

        return matchesArea && matchesSearch;
      }).toList();
    });
  }

  Future<void> _updateTableStatus(CafeTable table, String newStatus) async {
    try {
      await _apiService.updateTableStatus(table.idTable!, newStatus);
      await _loadTables();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Đã cập nhật trạng thái bàn ${table.tableNumber ?? table.idTable}',
            ),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi cập nhật: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showTableOptions(CafeTable table) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => SafeArea(
        child: Container(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Handle bar
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      color: AppTheme.textLight,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                // Title
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        Icons.table_restaurant,
                        color: AppTheme.primaryColor,
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Bàn ${table.tableNumber ?? table.idTable}',
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          Text(
                            table.location ?? 'N/A',
                            style: TextStyle(
                              fontSize: 14,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                // Info cards
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.backgroundColor,
                    borderRadius: AppTheme.mediumRadius,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildInfoItem(
                        Icons.people_outline,
                        '${table.capacity ?? 0}',
                        'Sức chứa',
                      ),
                      Container(
                        width: 1,
                        height: 40,
                        color: AppTheme.textLight.withOpacity(0.3),
                      ),
                      _buildInfoItem(
                        Icons.info_outline,
                        _getStatusText(table.status),
                        'Trạng thái',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Cập nhật trạng thái:',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                if (table.status != 'Available')
                  _buildActionButton(
                    icon: Icons.check_circle_outline,
                    title: 'Đặt trống',
                    subtitle: 'Bàn sẵn sàng phục vụ',
                    color: AppTheme.successColor,
                    onTap: () {
                      Navigator.pop(context);
                      _updateTableStatus(table, 'Available');
                    },
                  ),
                if (table.status != 'Available') const SizedBox(height: 12),
                if (table.status != 'Occupied')
                  _buildActionButton(
                    icon: Icons.people,
                    title: 'Đang phục vụ',
                    subtitle: 'Có khách đang sử dụng',
                    color: AppTheme.warningColor,
                    onTap: () {
                      Navigator.pop(context);
                      _updateTableStatus(table, 'Occupied');
                    },
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoItem(IconData icon, String value, String label) {
    return Column(
      children: [
        Icon(icon, color: AppTheme.primaryColor, size: 24),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
          ),
        ),
        Text(
          label,
          style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: AppTheme.mediumRadius,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: AppTheme.mediumRadius,
            border: Border.all(color: color.withOpacity(0.3), width: 1.5),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: color,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_ios, size: 16, color: color),
            ],
          ),
        ),
      ),
    );
  }

  String _getStatusText(String? status) {
    switch (status) {
      case 'Available':
        return 'Trống';
      case 'Occupied':
        return 'Đang phục vụ';
      default:
        return status ?? 'N/A';
    }
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'Available':
        return Colors.green;
      case 'Occupied':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  int get _availableCount =>
      _tables.where((t) => t.status == 'Available').length;
  int get _occupiedCount => _tables.where((t) => t.status == 'Occupied').length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        flexibleSpace: Container(
          decoration: const BoxDecoration(gradient: AppTheme.primaryGradient),
        ),
        title: const Text('Quản lý bàn'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadTables,
            tooltip: 'Làm mới',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Search and Filter
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      // Search box
                      TextField(
                        controller: _searchController,
                        decoration: InputDecoration(
                          hintText: 'Tìm kiếm bàn...',
                          prefixIcon: Icon(
                            Icons.search,
                            color: AppTheme.primaryColor,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: AppTheme.mediumRadius,
                            borderSide: BorderSide.none,
                          ),
                          filled: true,
                          fillColor: Colors.white,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                        ),
                        onChanged: (_) => _filterTables(),
                      ),
                      const SizedBox(height: 12),
                      // Area filter
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: AppTheme.mediumRadius,
                          boxShadow: AppTheme.softShadow,
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedArea,
                            isExpanded: true,
                            icon: Icon(
                              Icons.arrow_drop_down,
                              color: AppTheme.primaryColor,
                            ),
                            style: TextStyle(
                              color: AppTheme.textPrimary,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                            items: const [
                              DropdownMenuItem(
                                value: 'all',
                                child: Text('Tất cả khu vực'),
                              ),
                              DropdownMenuItem(
                                value: 'ground floor',
                                child: Text('Tầng trệt'),
                              ),
                              DropdownMenuItem(
                                value: 'first floor',
                                child: Text('Tầng 1'),
                              ),
                              DropdownMenuItem(
                                value: 'outdoor',
                                child: Text('Sân vườn'),
                              ),
                            ],
                            onChanged: (value) {
                              setState(() {
                                _selectedArea = value!;
                                _filterTables();
                              });
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Statistics
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      Expanded(
                        child: _buildStatCard(
                          'Tổng số bàn',
                          _tables.length.toString(),
                          Icons.table_restaurant,
                          Colors.blue,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildStatCard(
                          'Bàn trống',
                          _availableCount.toString(),
                          Icons.check_circle,
                          Colors.green,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildStatCard(
                          'Đang phục vụ',
                          _occupiedCount.toString(),
                          Icons.people,
                          Colors.orange,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Tables grid
                Expanded(
                  child: _filteredTables.isEmpty
                      ? const Center(child: Text('Không tìm thấy bàn nào'))
                      : GridView.builder(
                          padding: const EdgeInsets.all(16),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                childAspectRatio: 1.2,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 12,
                              ),
                          itemCount: _filteredTables.length,
                          itemBuilder: (context, index) {
                            final table = _filteredTables[index];
                            return _buildTableCard(table);
                          },
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: AppTheme.mediumRadius,
        boxShadow: AppTheme.softShadow,
        border: Border.all(color: color.withOpacity(0.2), width: 1.5),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              fontSize: 11,
              color: AppTheme.textSecondary,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildTableCard(CafeTable table) {
    final statusColor = _getStatusColor(table.status);
    final statusText = _getStatusText(table.status);

    return GestureDetector(
      onTap: () => _showTableOptions(table),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: AppTheme.mediumRadius,
          boxShadow: AppTheme.cardShadow,
        ),
        child: Stack(
          children: [
            // Gradient overlay
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: AppTheme.mediumRadius,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [statusColor.withOpacity(0.05), Colors.transparent],
                  ),
                ),
              ),
            ),
            // Status badge
            Positioned(
              top: 8,
              right: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [statusColor, statusColor.withOpacity(0.8)],
                  ),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: statusColor.withOpacity(0.3),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Text(
                  statusText,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            // Table info
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      Icons.table_restaurant,
                      size: 26,
                      color: statusColor,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    'Bàn ${table.tableNumber ?? table.idTable}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.location_on,
                        size: 12,
                        color: AppTheme.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          table.location ?? 'N/A',
                          style: TextStyle(
                            fontSize: 11,
                            color: AppTheme.textSecondary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Icon(
                        Icons.people_outline,
                        size: 12,
                        color: AppTheme.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${table.capacity ?? 0} người',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppTheme.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
