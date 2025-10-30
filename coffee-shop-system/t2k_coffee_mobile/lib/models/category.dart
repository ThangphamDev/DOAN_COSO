import 'product.dart';

class Category {
  final int? idCategory;
  final String? categoryName;
  final String? description;
  final List<Product>? products;

  Category({
    this.idCategory,
    this.categoryName,
    this.description,
    this.products,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    // Handle products array safely
    List<Product>? productsList;
    if (json['products'] != null) {
      if (json['products'] is List) {
        productsList = (json['products'] as List)
            .map((e) {
              if (e is Map<String, dynamic>) {
                return Product.fromJson(e);
              } else {
                print('Warning: Invalid product data in category: $e');
                return null;
              }
            })
            .where((product) => product != null)
            .cast<Product>()
            .toList();
      }
    }

    return Category(
      idCategory: (json['idCategory'] as num?)?.toInt(),
      categoryName: json['categoryName'] as String?,
      description: json['description'] as String?,
      products: productsList,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'idCategory': idCategory,
      'categoryName': categoryName,
      'description': description,
      'products': products?.map((product) => product.toJson()).toList(),
    };
  }
}
