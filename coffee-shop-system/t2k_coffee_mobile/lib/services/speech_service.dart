import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:permission_handler/permission_handler.dart';
import 'package:audioplayers/audioplayers.dart';

class SpeechService {
  static final SpeechService _instance = SpeechService._internal();
  factory SpeechService() => _instance;
  SpeechService._internal();

  final FlutterTts _flutterTts = FlutterTts();
  final stt.SpeechToText _speechToText = stt.SpeechToText();
  final AudioPlayer _audioPlayer = AudioPlayer();

  bool _isInitialized = false;
  bool _isListening = false;
  bool _isSpeaking = false;

  // Getters
  bool get isInitialized => _isInitialized;
  bool get isListening => _isListening;
  bool get isSpeaking => _isSpeaking;

  // Initialize speech services
  Future<bool> initialize() async {
    try {
      // Initialize TTS
      await _initializeTTS();

      // Initialize STT
      await _initializeSTT();

      _isInitialized = true;
      return true;
    } catch (e) {
      return false;
    }
  }

  // Initialize Text-to-Speech
  Future<void> _initializeTTS() async {
    await _flutterTts.setLanguage('vi-VN'); // Vietnamese
    await _flutterTts.setSpeechRate(0.5); // Slower speech rate
    await _flutterTts.setVolume(1.0);
    await _flutterTts.setPitch(1.0);

    // Set up TTS callbacks
    _flutterTts.setStartHandler(() {
      _isSpeaking = true;
    });

    _flutterTts.setCompletionHandler(() {
      _isSpeaking = false;
    });

    _flutterTts.setErrorHandler((msg) {
      _isSpeaking = false;
    });
  }

  // Initialize Speech-to-Text
  Future<void> _initializeSTT() async {
    // Request microphone permission
    final status = await Permission.microphone.request();
    if (status != PermissionStatus.granted) {
      throw Exception('Microphone permission not granted');
    }

    // Initialize speech to text
    final available = await _speechToText.initialize(
      onStatus: (status) {
        _isListening = status == 'listening';
      },
      onError: (error) {
        _isListening = false;
      },
    );

    if (!available) {
      throw Exception('Speech to text not available');
    }
  }

  // Speak text
  Future<void> speak(String text) async {
    if (!_isInitialized) {
      await initialize();
    }

    if (_isSpeaking) {
      await stopSpeaking();
    }

    try {
      await _flutterTts.speak(text);
    } catch (e) {
      // Silent fail for speech
    }
  }

  // Stop speaking
  Future<void> stopSpeaking() async {
    if (_isSpeaking) {
      await _flutterTts.stop();
    }
  }

  // Start listening for speech
  Future<void> startListening({
    Function(String)? onResult,
    Function(String)? onError,
  }) async {
    if (!_isInitialized) {
      await initialize();
    }

    if (_isListening) {
      await stopListening();
    }

    try {
      await _speechToText.listen(
        onResult: (result) {
          if (result.finalResult) {
            onResult?.call(result.recognizedWords);
          }
        },
        listenFor: const Duration(seconds: 30),
        pauseFor: const Duration(seconds: 3),
        partialResults: true,
        localeId: 'vi_VN', // Vietnamese
        cancelOnError: true,
        listenMode: stt.ListenMode.confirmation,
      );
    } catch (e) {
      onError?.call(e.toString());
    }
  }

  // Stop listening
  Future<void> stopListening() async {
    if (_isListening) {
      await _speechToText.stop();
    }
  }

  // Announce new order (for staff)
  Future<void> announceNewOrder({
    required int orderId,
    String? tableNumber,
    String? location,
    double? totalAmount,
  }) async {
    String message = 'Đơn hàng mới số $orderId';

    if (tableNumber != null && tableNumber != 'takeaway') {
      message += ' từ bàn $tableNumber';
    } else if (tableNumber == 'takeaway') {
      message += ' mang đi';
    }

    if (location != null) {
      message += ' tại $location';
    }

    if (totalAmount != null) {
      message += '. Tổng tiền ${totalAmount.toStringAsFixed(0)} đồng';
    }

    message += '. Vui lòng chuẩn bị ngay!';

    await speak(message);
  }

  // Announce order status update (for customers)
  Future<void> announceOrderUpdate({
    required int orderId,
    required String status,
  }) async {
    String statusText;
    switch (status.toLowerCase()) {
      case 'processing':
        statusText = 'đang xử lý';
        break;
      case 'preparing':
        statusText = 'đang chế biến';
        break;
      case 'ready':
        statusText = 'sẵn sàng';
        break;
      case 'completed':
        statusText = 'hoàn thành';
        break;
      case 'cancelled':
        statusText = 'đã hủy';
        break;
      default:
        statusText = status;
    }

    final message =
        'Đơn hàng số $orderId đã được cập nhật trạng thái: $statusText';
    await speak(message);
  }

  // Announce order ready (for customers)
  Future<void> announceOrderReady({
    required int orderId,
    String? tableNumber,
  }) async {
    String message = 'Đơn hàng số $orderId đã sẵn sàng';

    if (tableNumber != null && tableNumber != 'takeaway') {
      message += ' tại bàn $tableNumber';
    }

    message += '. Vui lòng đến lấy!';

    await speak(message);
  }

  // Play notification sound
  Future<void> playNotificationSound() async {
    try {
      // Play the notification bell sound
      await _audioPlayer.play(AssetSource('sounds/thongbao2.mp3'));
    } catch (e) {
      // If asset fails, try to create a simple beep sound
      try {
        // Create a simple notification sound using TTS with special characters
        await _flutterTts.setSpeechRate(2.0); // Fast rate for beep-like sound
        await _flutterTts.setVolume(0.8);
        await _flutterTts.speak('🔔'); // Just the bell emoji
        await Future.delayed(Duration(milliseconds: 500));
        await _flutterTts.speak('🔔'); // Second bell
        await Future.delayed(Duration(milliseconds: 500));
        await _flutterTts.speak('🔔'); // Third bell

        // Reset TTS settings
        await _flutterTts.setSpeechRate(0.5);
        await _flutterTts.setVolume(1.0);
      } catch (ttsError) {
        // Silent fallback - no sound played
      }
    }
  }

  // Test speech functionality
  Future<void> testSpeech() async {
    await speak('Xin chào! Đây là thử nghiệm chức năng phát âm thanh.');
  }

  // Test notification sound
  Future<void> testNotificationSound() async {
    await playNotificationSound();
  }

  // Check if speech is available
  Future<bool> isSpeechAvailable() async {
    try {
      if (!_isInitialized) {
        await initialize();
      }
      return _isInitialized;
    } catch (e) {
      return false;
    }
  }

  // Dispose resources
  void dispose() {
    stopSpeaking();
    stopListening();
    _audioPlayer.dispose();
  }
}
