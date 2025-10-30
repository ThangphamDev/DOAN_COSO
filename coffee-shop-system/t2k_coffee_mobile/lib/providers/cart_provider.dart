import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/cart_item.dart';
import '../models/product.dart';

class CartProvider with ChangeNotifier {
  List<CartItem> _items = [];
  bool _isLoading = false;
  int? _currentUserId;

  // Getters
  List<CartItem> get items => _items;
  bool get isLoading => _isLoading;
  bool get isEmpty => _items.isEmpty;
  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);
  double get totalAmount =>
      _items.fold(0.0, (sum, item) => sum + item.totalPrice);

  String get formattedTotalAmount {
    return '${totalAmount.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} đ';
  }

  // Initialize cart for specific user
  Future<void> initialize(int? userId) async {
    _currentUserId = userId;
    if (userId != null) {
      await _loadCart();
    } else {
      _items = [];
      notifyListeners();
    }
  }

  // Update user ID and load their cart
  Future<void> updateUserId(int? userId) async {
    if (_currentUserId != userId) {
      _currentUserId = userId;
      if (userId != null) {
        await _loadCart();
      } else {
        _items = [];
        notifyListeners();
      }
    }
  }

  // Save cart to SharedPreferences
  Future<void> _saveCart() async {
    if (_currentUserId == null) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      final cartKey = 'cart_$_currentUserId';

      final cartData = _items.map((item) => item.toJson()).toList();
      await prefs.setString(cartKey, json.encode(cartData));
    } catch (e) {
      print('Error saving cart: $e');
    }
  }

  // Load cart from SharedPreferences
  Future<void> _loadCart() async {
    if (_currentUserId == null) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      final cartKey = 'cart_$_currentUserId';

      final cartString = prefs.getString(cartKey);
      if (cartString != null) {
        final cartData = json.decode(cartString) as List;
        _items = cartData.map((item) => CartItem.fromJson(item)).toList();
        notifyListeners();
      }
    } catch (e) {
      print('Error loading cart: $e');
      _items = [];
    }
  }

  // Add item to cart
  void addItem(Product product, {ProductVariants? variants, int quantity = 1}) {
    final itemVariants = variants ?? ProductVariants.defaultVariants;

    // Check if item with same variants already exists
    final existingIndex = _items.indexWhere(
      (item) =>
          item.productId == product.idProduct &&
          _variantsEqual(item.variants, itemVariants),
    );

    if (existingIndex >= 0) {
      // Update quantity of existing item
      final existingItem = _items[existingIndex];
      final newQuantity = existingItem.quantity + quantity;
      final newTotalPrice = existingItem.price * newQuantity;

      _items[existingIndex] = existingItem.copyWith(
        quantity: newQuantity,
        totalPrice: newTotalPrice,
      );
    } else {
      // Add new item
      final price = product.price ?? 0.0;
      final newItem = CartItem(
        productId: product.idProduct!,
        productName: product.productName!,
        basePrice: price,
        price: price,
        quantity: quantity,
        variants: itemVariants,
        totalPrice: price * quantity,
      );

      _items.add(newItem);
    }

    _saveCart();
    notifyListeners();
  }

  // Remove item from cart
  void removeItem(int productId, ProductVariants variants) {
    _items.removeWhere(
      (item) =>
          item.productId == productId &&
          _variantsEqual(item.variants, variants),
    );
    _saveCart();
    notifyListeners();
  }

  // Update item quantity
  void updateQuantity(
    int productId,
    ProductVariants variants,
    int newQuantity,
  ) {
    if (newQuantity <= 0) {
      removeItem(productId, variants);
      return;
    }

    final index = _items.indexWhere(
      (item) =>
          item.productId == productId &&
          _variantsEqual(item.variants, variants),
    );

    if (index >= 0) {
      final item = _items[index];
      final newTotalPrice = item.price * newQuantity;

      _items[index] = item.copyWith(
        quantity: newQuantity,
        totalPrice: newTotalPrice,
      );
      _saveCart();
      notifyListeners();
    }
  }

  // Clear cart
  void clearCart() {
    _items = [];
    _isLoading = false;
    _saveCart();
    notifyListeners();
  }

  // Get item by product ID and variants
  CartItem? getItem(int productId, ProductVariants variants) {
    try {
      return _items.firstWhere(
        (item) =>
            item.productId == productId &&
            _variantsEqual(item.variants, variants),
      );
    } catch (e) {
      return null;
    }
  }

  // Check if product is in cart
  bool isInCart(int productId, ProductVariants variants) {
    return getItem(productId, variants) != null;
  }

  // Get quantity of specific item
  int getItemQuantity(int productId, ProductVariants variants) {
    final item = getItem(productId, variants);
    return item?.quantity ?? 0;
  }

  // Convert cart items to order format
  List<Map<String, dynamic>> toOrderItems() {
    return _items
        .map(
          (item) => {
            'productId': item.productId,
            'quantity': item.quantity,
            'unitPrice': item.price,
          },
        )
        .toList();
  }

  // Helper method to compare variants
  bool _variantsEqual(ProductVariants a, ProductVariants b) {
    return a.size == b.size &&
        a.ice == b.ice &&
        a.sugar == b.sugar &&
        listEquals(a.toppings ?? [], b.toppings ?? []);
  }

  // Set loading state
  void setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  // Load cart from storage (if needed)
  void loadCart(List<CartItem> items) {
    _items = items;
    notifyListeners();
  }

  // Get cart summary
  Map<String, dynamic> getCartSummary() {
    return {
      'itemCount': itemCount,
      'totalAmount': totalAmount,
      'formattedTotalAmount': formattedTotalAmount,
      'items': _items
          .map(
            (item) => {
              'productId': item.productId,
              'productName': item.productName,
              'quantity': item.quantity,
              'price': item.price,
              'totalPrice': item.totalPrice,
              'variants': {
                'size': item.variants.size,
                'ice': item.variants.ice,
                'sugar': item.variants.sugar,
                'toppings': item.variants.toppings,
              },
            },
          )
          .toList(),
    };
  }
}
