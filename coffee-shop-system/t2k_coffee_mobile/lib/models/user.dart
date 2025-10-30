import 'package:json_annotation/json_annotation.dart';
import '../utils/api_config.dart';

part 'user.g.dart';

@JsonSerializable()
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

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);

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
