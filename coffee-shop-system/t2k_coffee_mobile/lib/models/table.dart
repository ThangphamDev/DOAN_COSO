class CafeTable {
  final int? idTable;
  final String? tableName;
  final int? tableNumber;
  final String? status;
  final String? location;
  final int? capacity;
  final String? notes;

  CafeTable({
    this.idTable,
    this.tableName,
    this.tableNumber,
    this.status,
    this.location,
    this.capacity,
    this.notes,
  });

  factory CafeTable.fromJson(Map<String, dynamic> json) {
    return CafeTable(
      idTable: json['idTable'] as int?,
      tableName: json['tableName'] as String?,
      tableNumber: json['tableNumber'] as int?,
      status: json['status'] as String?,
      location: json['location'] as String?,
      capacity: json['capacity'] as int?,
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'idTable': idTable,
      'tableName': tableName,
      'tableNumber': tableNumber,
      'status': status,
      'location': location,
      'capacity': capacity,
      'notes': notes,
    };
  }

  bool get isAvailable => status?.toLowerCase() == 'available';
  bool get isOccupied => status?.toLowerCase() == 'occupied';
}
