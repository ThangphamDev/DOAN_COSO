import '../utils/api_config.dart';

class Product {
  final int? idProduct;
  final String? productName;
  final double? price;
  final String? description;
  final String? image;
  final bool? isAvailable;
  final int? categoryId;
  final String? categoryName;

  Product({
    this.idProduct,
    this.productName,
    this.price,
    this.description,
    this.image,
    this.isAvailable,
    this.categoryId,
    this.categoryName,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      idProduct: json['idProduct'] as int?,
      productName: json['productName'] as String?,
      price: (json['price'] as num?)?.toDouble(),
      description: json['description'] as String?,
      image: json['image'] as String?,
      isAvailable: json['isAvailable'] as bool?,
      categoryId: json['categoryId'] as int?,
      categoryName: json['categoryName'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'idProduct': idProduct,
      'productName': productName,
      'price': price,
      'description': description,
      'image': image,
      'isAvailable': isAvailable,
      'categoryId': categoryId,
      'categoryName': categoryName,
    };
  }

  Product copyWith({
    int? idProduct,
    String? productName,
    double? price,
    String? description,
    String? image,
    bool? isAvailable,
    int? categoryId,
    String? categoryName,
  }) {
    return Product(
      idProduct: idProduct ?? this.idProduct,
      productName: productName ?? this.productName,
      price: price ?? this.price,
      description: description ?? this.description,
      image: image ?? this.image,
      isAvailable: isAvailable ?? this.isAvailable,
      categoryId: categoryId ?? this.categoryId,
      categoryName: categoryName ?? this.categoryName,
    );
  }

  String get formattedPrice {
    if (price == null) return '0 đ';
    return '${price!.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} đ';
  }

  String get imageUrl {
    if (image == null || image!.isEmpty) {
      return 'assets/images/default-product.png';
    }
    if (image!.startsWith('http')) {
      return image!;
    }
    // Construct full URL with base URL from ApiConfig
    return '${ApiConfig.baseUrl}/uploads/images/$image';
  }
}
