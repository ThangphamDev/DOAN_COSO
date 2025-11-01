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
    // Support both camelCase and snake_case for rewardPoints
    int? rewardPoints;
    if (json['rewardPoints'] != null) {
      rewardPoints = json['rewardPoints'] is int
          ? json['rewardPoints'] as int
          : int.tryParse(json['rewardPoints'].toString());
    } else if (json['reward_points'] != null) {
      rewardPoints = json['reward_points'] is int
          ? json['reward_points'] as int
          : int.tryParse(json['reward_points'].toString());
    }

    return User(
      idAccount: json['idAccount'] != null
          ? (json['idAccount'] is int
                ? json['idAccount'] as int
                : int.tryParse(json['idAccount'].toString()))
          : null,
      userName: json['userName'] as String? ?? json['user_name'] as String?,
      fullName: json['fullName'] as String? ?? json['full_name'] as String?,
      phone: json['phone'] as String?,
      address: json['address'] as String?,
      image: json['image'] as String?,
      role: json['role'] as String?,
      rewardPoints: rewardPoints,
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
