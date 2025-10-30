import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/cart_provider.dart';
import '../../models/product.dart';
import '../../models/category.dart';
import '../../models/cart_item.dart';
import '../../services/api_service.dart';
import '../../utils/app_theme.dart';
import '../../widgets/modern_product_card.dart';
import '../../widgets/modern_category_chip.dart';
import '../../widgets/modern_button.dart';
import '../../widgets/loading_widget.dart';

class ModernMenuScreen extends StatefulWidget {
  const ModernMenuScreen({super.key});

  @override
  State<ModernMenuScreen> createState() => _ModernMenuScreenState();
}

class _ModernMenuScreenState extends State<ModernMenuScreen>
    with TickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  final TextEditingController _searchController = TextEditingController();

  List<Category> _categories = [];
  List<Product> _products = [];
  List<Product> _filteredProducts = [];
  bool _isLoading = true;
  String? _error;
  int _selectedCategoryIndex = 0;
  String _searchQuery = '';

  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      duration: AppTheme.slowDuration,
      vsync: this,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: AppTheme.smoothCurve,
    );
    _loadData();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    if (mounted) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    try {
      final results = await Future.wait([
        _apiService.getCategories(),
        _apiService.getProducts(),
      ]);

      final categories = results[0] as List<Category>;
      final products = results[1] as List<Product>;

      if (mounted) {
        setState(() {
          _categories = categories;
          _products = products;
          _filteredProducts = products;
          _isLoading = false;
        });
        _fadeController.forward();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  void _filterProductsByCategory(int categoryIndex) {
    setState(() {
      _selectedCategoryIndex = categoryIndex;
      _applyFilters();
    });
  }

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query.toLowerCase();
      _applyFilters();
    });
  }

  void _applyFilters() {
    List<Product> filtered = _products;

    // Filter by category
    if (_selectedCategoryIndex != 0) {
      final categoryId = _categories[_selectedCategoryIndex - 1].idCategory;
      filtered =
          filtered.where((product) => product.categoryId == categoryId).toList();
    }

    // Filter by search query
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((product) {
        final name = product.productName?.toLowerCase() ?? '';
        final description = product.description?.toLowerCase() ?? '';
        return name.contains(_searchQuery) || description.contains(_searchQuery);
      }).toList();
    }

    setState(() {
      _filteredProducts = filtered;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        _buildAppBar(),
        if (_isLoading)
          const SliverFillRemaining(
            child: LoadingWidget(message: 'Đang tải menu...'),
          )
        else if (_error != null)
          SliverFillRemaining(child: _buildErrorWidget())
        else ...[
          _buildSearchBar(),
          _buildCategoryChips(),
          _buildProductsGrid(),
        ],
      ],
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      floating: true,
      pinned: true,
      expandedHeight: 120,
      backgroundColor: Colors.transparent,
      flexibleSpace: Container(
        decoration: const BoxDecoration(
          gradient: AppTheme.primaryGradient,
          borderRadius: BorderRadius.vertical(
            bottom: Radius.circular(24),
          ),
          boxShadow: [
            BoxShadow(
              color: Color(0x20000000),
              blurRadius: 10,
              offset: Offset(0, 5),
            ),
          ],
        ),
        child: FlexibleSpaceBar(
          centerTitle: true,
          title: const Text(
            'Menu',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              letterSpacing: 0.5,
            ),
          ),
          background: Container(
            decoration: const BoxDecoration(
              gradient: AppTheme.primaryGradient,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
        child: Container(
          decoration: BoxDecoration(
            color: AppTheme.surfaceColor,
            borderRadius: AppTheme.mediumRadius,
            boxShadow: AppTheme.softShadow,
          ),
          child: TextField(
            controller: _searchController,
            onChanged: _onSearchChanged,
            decoration: InputDecoration(
              hintText: 'Tìm kiếm món ăn, đồ uống...',
              hintStyle: TextStyle(
                color: AppTheme.textSecondary.withValues(alpha: 0.6),
              ),
              prefixIcon: const Icon(
                Icons.search_rounded,
                color: AppTheme.primaryColor,
              ),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(
                        Icons.clear_rounded,
                        color: AppTheme.textSecondary,
                      ),
                      onPressed: () {
                        _searchController.clear();
                        _onSearchChanged('');
                      },
                    )
                  : null,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 20,
                vertical: 16,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryChips() {
    if (_categories.isEmpty) {
      return const SliverToBoxAdapter(child: SizedBox.shrink());
    }

    return SliverToBoxAdapter(
      child: SizedBox(
        height: 56,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: _categories.length + 1,
          itemBuilder: (context, index) {
            final isSelected = index == _selectedCategoryIndex;
            final categoryName = index == 0
                ? 'Tất cả'
                : _categories[index - 1].categoryName ?? '';
            final icon = index == 0 ? Icons.apps_rounded : Icons.local_cafe_rounded;

            return ModernCategoryChip(
              label: categoryName,
              isSelected: isSelected,
              onTap: () => _filterProductsByCategory(index),
              icon: icon,
            );
          },
        ),
      ),
    );
  }

  Widget _buildProductsGrid() {
    if (_filteredProducts.isEmpty) {
      return SliverFillRemaining(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppTheme.backgroundColor,
                  shape: BoxShape.circle,
                  boxShadow: AppTheme.softShadow,
                ),
                child: const Icon(
                  Icons.search_off_rounded,
                  size: 64,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Không tìm thấy sản phẩm',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                _searchQuery.isNotEmpty
                    ? 'Thử tìm kiếm với từ khóa khác'
                    : 'Vui lòng thử lại sau',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
              ),
            ],
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.all(16),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.7,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final product = _filteredProducts[index];
            return FadeTransition(
              opacity: _fadeAnimation,
              child: ModernProductCard(
                product: product,
                onTap: () {
                  // Navigate to product detail (if exists)
                  _showAddToCartDialog(product);
                },
                onAddToCart: () => _showAddToCartDialog(product),
              ),
            );
          },
          childCount: _filteredProducts.length,
        ),
      ),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppTheme.errorColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.error_outline_rounded,
                size: 64,
                color: AppTheme.errorColor,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Không thể tải menu',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              _error ?? 'Đã xảy ra lỗi',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ModernButton(
              text: 'Thử lại',
              onPressed: _loadData,
              icon: Icons.refresh_rounded,
              type: ModernButtonType.primary,
            ),
          ],
        ),
      ),
    );
  }

  void _showAddToCartDialog(Product product) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ModernAddToCartBottomSheet(product: product),
    );
  }
}

// Modern Bottom Sheet for Add to Cart
class ModernAddToCartBottomSheet extends StatefulWidget {
  final Product product;

  const ModernAddToCartBottomSheet({super.key, required this.product});

  @override
  State<ModernAddToCartBottomSheet> createState() =>
      _ModernAddToCartBottomSheetState();
}

class _ModernAddToCartBottomSheetState
    extends State<ModernAddToCartBottomSheet> with TickerProviderStateMixin {
  int _quantity = 1;
  String _selectedSize = 'M';
  String _iceLevel = 'Bình thường';
  String _sugarLevel = 'Bình thường';
  final List<String> _selectedToppings = [];

  final List<String> _sizes = ['S', 'M', 'L'];
  final List<String> _toppings = [
    'Trân châu',
    'Thạch dừa',
    'Kem cheese',
    'Đậu đỏ',
    'Kem tươi',
  ];

  late AnimationController _slideController;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _slideController = AnimationController(
      duration: AppTheme.normalDuration,
      vsync: this,
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 1),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _slideController,
      curve: AppTheme.smoothCurve,
    ));
    _slideController.forward();
  }

  @override
  void dispose() {
    _slideController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final totalPrice = (widget.product.price ?? 0) * _quantity;

    return SlideTransition(
      position: _slideAnimation,
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.85,
        ),
        decoration: const BoxDecoration(
          color: AppTheme.surfaceColor,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppTheme.textLight.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // Content
            Flexible(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: EdgeInsets.only(
                  left: 24,
                  right: 24,
                  top: 20,
                  bottom: MediaQuery.of(context).viewInsets.bottom + 100,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildProductHeader(),
                    const SizedBox(height: 24),
                    _buildSizeSelection(),
                    const SizedBox(height: 24),
                    _buildIceLevel(),
                    const SizedBox(height: 24),
                    _buildSugarLevel(),
                    const SizedBox(height: 24),
                    _buildToppings(),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
            // Bottom action bar
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppTheme.surfaceColor,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(20),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -5),
                  ),
                ],
              ),
              child: Row(
                children: [
                  _buildQuantitySelector(),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ModernButton(
                      text: '${totalPrice.toStringAsFixed(0)} đ',
                      onPressed: _addToCart,
                      type: ModernButtonType.accent,
                      icon: Icons.shopping_bag_rounded,
                      isFullWidth: true,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductHeader() {
    return Row(
      children: [
        ClipRRect(
          borderRadius: AppTheme.largeRadius,
          child: CachedNetworkImage(
            imageUrl: widget.product.imageUrl,
            width: 100,
            height: 100,
            fit: BoxFit.cover,
            placeholder: (context, url) => Container(
              width: 100,
              height: 100,
              color: AppTheme.backgroundColor,
              child: const Center(
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
            errorWidget: (context, url, error) => Container(
              width: 100,
              height: 100,
              color: AppTheme.backgroundColor,
              child: const Icon(Icons.coffee, size: 40),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.product.productName ?? '',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 4),
              if (widget.product.description != null) ...[
                Text(
                  widget.product.description!,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppTheme.textSecondary,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
              ],
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  gradient: AppTheme.primaryGradient,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  widget.product.formattedPrice,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            gradient: AppTheme.primaryGradient,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 18, color: Colors.white),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildSizeSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Kích thước', Icons.fullscreen_rounded),
        const SizedBox(height: 12),
        Row(
          children: _sizes.map((size) {
            final isSelected = _selectedSize == size;
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () => setState(() => _selectedSize = size),
                  child: AnimatedContainer(
                    duration: AppTheme.fastDuration,
                    curve: AppTheme.quickCurve,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      gradient:
                          isSelected ? AppTheme.primaryGradient : null,
                      color: isSelected ? null : AppTheme.backgroundColor,
                      borderRadius: AppTheme.mediumRadius,
                      border: Border.all(
                        color: isSelected
                            ? Colors.transparent
                            : AppTheme.textLight.withValues(alpha: 0.3),
                        width: 2,
                      ),
                      boxShadow:
                          isSelected ? AppTheme.cardShadow : null,
                    ),
                    child: Text(
                      size,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: isSelected ? Colors.white : AppTheme.textPrimary,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildIceLevel() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Mức độ đá', Icons.ac_unit_rounded),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: ['Không đá', 'Ít đá', 'Bình thường', 'Nhiều đá']
              .map((level) {
            final isSelected = _iceLevel == level;
            return _buildOptionChip(
              label: level,
              isSelected: isSelected,
              onTap: () => setState(() => _iceLevel = level),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildSugarLevel() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Mức độ đường', Icons.grain_rounded),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children:
              ['Không đường', 'Ít đường', 'Bình thường', 'Nhiều đường']
                  .map((level) {
            final isSelected = _sugarLevel == level;
            return _buildOptionChip(
              label: level,
              isSelected: isSelected,
              onTap: () => setState(() => _sugarLevel = level),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildToppings() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Topping', Icons.add_circle_outline_rounded),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _toppings.map((topping) {
            final isSelected = _selectedToppings.contains(topping);
            return _buildOptionChip(
              label: topping,
              isSelected: isSelected,
              onTap: () {
                setState(() {
                  if (isSelected) {
                    _selectedToppings.remove(topping);
                  } else {
                    _selectedToppings.add(topping);
                  }
                });
              },
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildOptionChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: AppTheme.fastDuration,
        curve: AppTheme.quickCurve,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          gradient: isSelected ? AppTheme.accentGradient : null,
          color: isSelected ? null : AppTheme.surfaceColor,
          borderRadius: AppTheme.pillRadius,
          border: Border.all(
            color: isSelected
                ? Colors.transparent
                : AppTheme.textLight.withValues(alpha: 0.3),
            width: isSelected ? 0 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppTheme.accentColor.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppTheme.textPrimary,
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildQuantitySelector() {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.backgroundColor,
        borderRadius: AppTheme.mediumRadius,
        border: Border.all(
          color: AppTheme.textLight.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
            icon: const Icon(Icons.remove_rounded),
            color: _quantity > 1 ? AppTheme.primaryColor : AppTheme.textLight,
            iconSize: 20,
          ),
          Container(
            constraints: const BoxConstraints(minWidth: 36),
            alignment: Alignment.center,
            child: Text(
              _quantity.toString(),
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
          ),
          IconButton(
            onPressed: () => setState(() => _quantity++),
            icon: const Icon(Icons.add_rounded),
            color: AppTheme.primaryColor,
            iconSize: 20,
          ),
        ],
      ),
    );
  }

  void _addToCart() {
    final cartProvider = Provider.of<CartProvider>(context, listen: false);

    final variants = ProductVariants(
      size: _selectedSize,
      ice: _iceLevel,
      sugar: _sugarLevel,
      toppings: _selectedToppings,
    );

    cartProvider.addItem(
      widget.product,
      variants: variants,
      quantity: _quantity,
    );

    Navigator.of(context).pop();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.check_circle_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Đã thêm ${widget.product.productName} vào giỏ hàng',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
        backgroundColor: AppTheme.successColor,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: AppTheme.mediumRadius,
        ),
        duration: const Duration(seconds: 2),
      ),
    );
  }
}
