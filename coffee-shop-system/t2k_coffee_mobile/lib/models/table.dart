class CafeTable {
  final int? idTable;
  final String? tableName;
  final String? status;

  CafeTable({this.idTable, this.tableName, this.status});

  factory CafeTable.fromJson(Map<String, dynamic> json) {
    return CafeTable(
      idTable: json['idTable'] as int?,
      tableName: json['tableName'] as String?,
      status: json['status'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'idTable': idTable,
      'tableName': tableName,
      'status': status,
    };
  }

  bool get isAvailable => status?.toLowerCase() == 'available';
  bool get isOccupied => status?.toLowerCase() == 'occupied';
}
