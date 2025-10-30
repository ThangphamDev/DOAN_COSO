import '../utils/api_config.dart';

class User {
  final int? idAccount;
  final String? userName;
  final String? fullName;
  final String? phone;
  final String? address;
  final String? image;
  final String? role;
  final int? rewardPoints;
  final String? status;

  User({
    this.idAccount,
    this.userName,
    this.fullName,
    this.phone,
    this.address,
    this.image,
    this.role,
    this.rewardPoints,
    this.status,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      idAccount: json['idAccount'] as int?,
      userName: json['userName'] as String?,
      fullName: json['fullName'] as String?,
      phone: json['phone'] as String?,
      address: json['address'] as String?,
      image: json['image'] as String?,
      role: json['role'] as String?,
      rewardPoints: json['rewardPoints'] as int?,
      status: json['status'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'idAccount': idAccount,
      'userName': userName,
      'fullName': fullName,
      'phone': phone,
      'address': address,
      'image': image,
      'role': role,
      'rewardPoints': rewardPoints,
      'status': status,
    };
  }

  User copyWith({
    int? idAccount,
    String? userName,
    String? fullName,
    String? phone,
    String? address,
    String? image,
    String? role,
    int? rewardPoints,
    String? status,
  }) {
    return User(
      idAccount: idAccount ?? this.idAccount,
      userName: userName ?? this.userName,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      image: image ?? this.image,
      role: role ?? this.role,
      rewardPoints: rewardPoints ?? this.rewardPoints,
      status: status ?? this.status,
    );
  }

  bool get isAdmin => role?.toUpperCase() == 'ADMIN';
  bool get isStaff => role?.toUpperCase() == 'STAFF';
  bool get isCustomer => role?.toUpperCase() == 'CUSTOMER' || role == null;

  String get imageUrl {
    if (image == null || image!.isEmpty) {
      return 'assets/images/default-avatar.png';
    }
    if (image!.startsWith('http')) {
      return image!;
    }
    // Construct full URL with base URL from ApiConfig
    return '${ApiConfig.baseUrl}/uploads/images/$image';
  }
}
