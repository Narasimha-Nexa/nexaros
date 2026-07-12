import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_colors.dart';

/// A text field that captures barcode scans from HID (keyboard-emulating) scanners.
///
/// HID barcode scanners send keystrokes in rapid succession, typically ending
/// with a newline (Enter key). This widget listens for that rapid input pattern
/// and fires the [onBarcodeScanned] callback when detected.
class BarcodeScannerField extends StatefulWidget {
  final ValueChanged<String> onBarcodeScanned;
  final String? hintText;
  final String? labelText;

  const BarcodeScannerField({
    super.key,
    required this.onBarcodeScanned,
    this.hintText,
    this.labelText,
  });

  @override
  State<BarcodeScannerField> createState() => _BarcodeScannerFieldState();
}

class _BarcodeScannerFieldState extends State<BarcodeScannerField> {
  final _focusNode = FocusNode();
  final _controller = TextEditingController();
  bool _isListening = false;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() {
      if (_focusNode.hasFocus) {
        _isListening = true;
      } else {
        _isListening = false;
      }
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    _controller.dispose();
    super.dispose();
  }

  /// Simulate a barcode scan (useful for testing or manual entry)
  void simulateScan(String barcode) {
    widget.onBarcodeScanned(barcode);
  }

  @override
  Widget build(BuildContext context) {
    return KeyboardListener(
      focusNode: _focusNode,
      onKeyEvent: (event) {
        if (!_isListening) return;
        // HID scanners send text rapidly, ending with Enter
        if (event is KeyDownEvent) {
          final key = event.logicalKey;
          // Enter key signals end of scan
          if (key == LogicalKeyboardKey.enter) {
            final barcode = _controller.text.trim();
            if (barcode.isNotEmpty) {
              widget.onBarcodeScanned(barcode);
              _controller.clear();
            }
            return;
          }
          // Backspace/delete handled naturally by TextField
        }
      },
      child: TextField(
        controller: _controller,
        decoration: InputDecoration(
          hintText: widget.hintText ?? 'Scan or type barcode...',
          labelText: widget.labelText,
          prefixIcon: const Icon(Icons.qr_code_scanner, size: 20),
          suffixIcon: _controller.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.check_circle, size: 20, color: AppColors.success),
                  onPressed: () => simulateScan(_controller.text.trim()),
                )
              : null,
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        ),
        onChanged: (_) => setState(() {}),
        onSubmitted: (value) {
          if (value.trim().isNotEmpty) {
            simulateScan(value.trim());
          }
        },
      ),
    );
  }
}


