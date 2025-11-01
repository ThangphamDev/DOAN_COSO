import 'dart:convert';
import 'user.dart';
import 'product.dart';

class Order {
  final int? idOrder;
  final int? tableId;
  final String? tableNumber;
  final String? location;
  final int? quantity;
  final DateTime? orderTime;
  final double? totalAmount;
  final String? note;
  final String? status;
  final int? accountId;
  final int? promotionId;
  final List<OrderDetail>? orderDetails;
  final Payment? payment;
  final User? account;
  final Table? table;

  Order({
    this.idOrder,
    this.tableId,
    this.tableNumber,
    this.location,
    this.quantity,
    this.orderTime,
    this.totalAmount,
    this.note,
    this.status,
    this.accountId,
    this.promotionId,
    this.orderDetails,
    this.payment,
    this.account,
    this.table,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      idOrder: json['idOrder'] as int?,
      tableId: json['tableId'] as int?,
      tableNumber: json['tableNumber'] as String?,
      location: json['location'] as String?,
      quantity: json['quantity'] as int?,
      orderTime: json['orderTime'] != null
          ? DateTime.parse(json['orderTime'] as String)
          : null,
      totalAmount: (json['totalAmount'] as num?)?.toDouble(),
      note: json['note'] as String?,
      status: json['status'] as String?,
      accountId: json['accountId'] as int?,
      promotionId: json['promotionId'] as int?,
      orderDetails: json['orderDetails'] != null
          ? (json['orderDetails'] as List)
                .map((e) => OrderDetail.fromJson(e as Map<String, dynamic>))
                .toList()
          : null,
      payment: json['payment'] != null
          ? Payment.fromJson(json['payment'] as Map<String, dynamic>)
          : null,
      account: json['account'] != null
          ? User.fromJson(json['account'] as Map<String, dynamic>)
          : null,
      table: json['table'] != null
          ? Table.fromJson(json['table'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'idOrder': idOrder,
      'tableId': tableId,
      'tableNumber': tableNumber,
      'location': location,
      'quantity': quantity,
      'orderTime': orderTime?.toIso8601String(),
      'totalAmount': totalAmount,
      'note': note,
      'status': status,
      'accountId': accountId,
      'promotionId': promotionId,
      'orderDetails': orderDetails?.map((e) => e.toJson()).toList(),
      'payment': payment?.toJson(),
      'account': account?.toJson(),
      'table': table?.toJson(),
    };
  }

  Order copyWith({
    int? idOrder,
    int? tableId,
    String? tableNumber,
    String? location,
    int? quantity,
    DateTime? orderTime,
    double? totalAmount,
    String? note,
    String? status,
    int? accountId,
    int? promotionId,
    List<OrderDetail>? orderDetails,
    Payment? payment,
    User? account,
    Table? table,
  }) {
    return Order(
      idOrder: idOrder ?? this.idOrder,
      tableId: tableId ?? this.tableId,
      tableNumber: tableNumber ?? this.tableNumber,
      location: location ?? this.location,
      quantity: quantity ?? this.quantity,
      orderTime: orderTime ?? this.orderTime,
      totalAmount: totalAmount ?? this.totalAmount,
      note: note ?? this.note,
      status: status ?? this.status,
      accountId: accountId ?? this.accountId,
      promotionId: promotionId ?? this.promotionId,
      orderDetails: orderDetails ?? this.orderDetails,
      payment: payment ?? this.payment,
      account: account ?? this.account,
      table: table ?? this.table,
    );
  }

  String get formattedTotalAmount {
    if (totalAmount == null) return '0 đ';
    return '${totalAmount!.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} đ';
  }

  String get statusText {
    switch (status?.toLowerCase()) {
      case 'processing':
        return 'Đang xử lý';
      case 'preparing':
        return 'Đang chế biến';
      case 'ready':
        return 'Sẵn sàng';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status ?? 'Không xác định';
    }
  }

  bool get isProcessing => status?.toLowerCase() == 'processing';
  bool get isPreparing => status?.toLowerCase() == 'preparing';
  bool get isReady => status?.toLowerCase() == 'ready';
  bool get isCompleted => status?.toLowerCase() == 'completed';
  bool get isCancelled => status?.toLowerCase() == 'cancelled';

  String get displayLocation {
    // Kiểm tra nếu có tableNumber từ DTO (String) - ưu tiên
    if (tableNumber != null &&
        tableNumber!.isNotEmpty &&
        tableNumber != 'takeaway') {
      return 'Bàn $tableNumber';
    }

    // Kiểm tra nếu có table object (dine-in)
    if (table != null && table!.tableNumber != null) {
      String locationText = 'Bàn ${table!.tableNumber}';
      if (table!.location != null && table!.location!.isNotEmpty) {
        locationText += ' (${table!.location})';
      }
      return locationText;
    }

    // Nếu không có table, mặc định là takeaway
    return 'Mang đi';
  }

  // Tính số điểm tích lũy cho đơn hàng (1 điểm cho mỗi 10,000 VND)
  int get earnedRewardPoints {
    if (totalAmount == null || totalAmount! <= 0) return 0;
    return (totalAmount! / 10000).floor().toInt();
  }
}

class OrderDetail {
  final int? productId;
  final int? orderId;
  final Product? product;
  final int? quantity;
  final double? unitPrice;
  final double? subtotal;
  final String? size;
  final String? icePercent;
  final String? sugarPercent;
  final String? toppings;

  OrderDetail({
    this.productId,
    this.orderId,
    this.product,
    this.quantity,
    this.unitPrice,
    this.subtotal,
    this.size,
    this.icePercent,
    this.sugarPercent,
    this.toppings,
  });

  factory OrderDetail.fromJson(Map<String, dynamic> json) {
    return OrderDetail(
      productId: json['productId'] as int?,
      orderId: json['orderId'] as int?,
      product: json['product'] != null
          ? Product.fromJson(json['product'] as Map<String, dynamic>)
          : null,
      quantity: json['quantity'] as int?,
      unitPrice: (json['unitPrice'] as num?)?.toDouble(),
      subtotal: (json['subtotal'] as num?)?.toDouble(),
      size: json['size'] as String?,
      icePercent:
          json['icePercent'] as String? ?? json['ice_percent'] as String?,
      sugarPercent:
          json['sugarPercent'] as String? ?? json['sugar_percent'] as String?,
      toppings: json['toppings'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'productId': productId,
      'orderId': orderId,
      'product': product?.toJson(),
      'quantity': quantity,
      'unitPrice': unitPrice,
      'subtotal': subtotal,
      'size': size,
      'icePercent': icePercent,
      'sugarPercent': sugarPercent,
      'toppings': toppings,
    };
  }

  String get variantDescription {
    List<String> descriptions = [];

    // Size
    if (size != null && size!.isNotEmpty && size!.toLowerCase() != 's') {
      descriptions.add('Size: $size');
    }

    // Ice
    if (icePercent != null && icePercent!.isNotEmpty && icePercent != '100') {
      descriptions.add('Đá: $icePercent%');
    }

    // Sugar
    if (sugarPercent != null &&
        sugarPercent!.isNotEmpty &&
        sugarPercent != '100') {
      descriptions.add('Đường: $sugarPercent%');
    }

    // Toppings
    if (toppings != null && toppings!.isNotEmpty) {
      // Toppings có thể là JSON string hoặc comma-separated
      try {
        final toppingsList = List<String>.from(json.decode(toppings!) as List);
        if (toppingsList.isNotEmpty) {
          descriptions.add('Topping: ${toppingsList.join(', ')}');
        }
      } catch (e) {
        // Nếu không phải JSON array, coi như là string
        descriptions.add('Topping: $toppings');
      }
    }

    return descriptions.join(' • ');
  }

  bool get hasVariants {
    final hasSize =
        size != null && size!.isNotEmpty && size!.toLowerCase() != 's';
    final hasIce =
        icePercent != null && icePercent!.isNotEmpty && icePercent != '100';
    final hasSugar =
        sugarPercent != null &&
        sugarPercent!.isNotEmpty &&
        sugarPercent != '100';
    final hasToppings = toppings != null && toppings!.isNotEmpty;
    return hasSize || hasIce || hasSugar || hasToppings;
  }

  String get formattedUnitPrice {
    if (unitPrice == null || unitPrice == 0) return '0 đ';
    return '${unitPrice!.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} đ';
  }

  String get formattedSubtotal {
    double calculatedSubtotal = 0;

    // Nếu subtotal null, tính từ unitPrice * quantity
    if (subtotal == null || subtotal == 0) {
      if (unitPrice != null && quantity != null) {
        calculatedSubtotal = unitPrice! * quantity!;
      }
    } else {
      calculatedSubtotal = subtotal!;
    }

    if (calculatedSubtotal == 0) return '0 đ';
    return '${calculatedSubtotal.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} đ';
  }
}

class Payment {
  final int? idPayment;
  final int? orderId;
  final DateTime? createAt;
  final String? paymentMethod;
  final String? paymentStatus;

  Payment({
    this.idPayment,
    this.orderId,
    this.createAt,
    this.paymentMethod,
    this.paymentStatus,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      idPayment: json['idPayment'] as int?,
      orderId: json['orderId'] as int?,
      createAt: json['createAt'] != null
          ? DateTime.parse(json['createAt'] as String)
          : null,
      paymentMethod: json['paymentMethod'] as String?,
      paymentStatus: json['paymentStatus'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'idPayment': idPayment,
      'orderId': orderId,
      'createAt': createAt?.toIso8601String(),
      'paymentMethod': paymentMethod,
      'paymentStatus': paymentStatus,
    };
  }

  String get paymentMethodText {
    switch (paymentMethod?.toLowerCase()) {
      case 'cash':
        return 'Tiền mặt';
      case 'transfer':
        return 'Chuyển khoản';
      case 'card':
        return 'Thẻ';
      default:
        return paymentMethod ?? 'Không xác định';
    }
  }

  String get paymentStatusText {
    switch (paymentStatus?.toLowerCase()) {
      case 'pending':
        return 'Chờ thanh toán';
      case 'completed':
        return 'Đã thanh toán';
      case 'failed':
        return 'Thanh toán thất bại';
      default:
        return paymentStatus ?? 'Không xác định';
    }
  }

  bool get isCompleted => paymentStatus?.toLowerCase() == 'completed';
}

class Table {
  final int? idTable;
  final String? status;
  final int? capacity;
  final String? location;
  final int? tableNumber;

  Table({
    this.idTable,
    this.status,
    this.capacity,
    this.location,
    this.tableNumber,
  });

  factory Table.fromJson(Map<String, dynamic> json) {
    return Table(
      idTable: json['idTable'] as int?,
      status: json['status'] as String?,
      capacity: json['capacity'] as int?,
      location: json['location'] as String?,
      tableNumber: json['tableNumber'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'idTable': idTable,
      'status': status,
      'capacity': capacity,
      'location': location,
      'tableNumber': tableNumber,
    };
  }

  String get statusText {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'Trống';
      case 'occupied':
        return 'Đang phục vụ';
      case 'reserved':
        return 'Đã đặt';
      default:
        return status ?? 'Không xác định';
    }
  }

  bool get isAvailable => status?.toLowerCase() == 'available';
  bool get isOccupied => status?.toLowerCase() == 'occupied';
}
