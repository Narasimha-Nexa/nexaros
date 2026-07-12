import 'dart:typed_data';

class EscPosBuilder {
  final List<int> _bytes = [];

  static const _init = [0x1B, 0x40];
  static const _cut = [0x1D, 0x56, 0x00];
  static const _boldOn = [0x1B, 0x45, 0x01];
  static const _boldOff = [0x1B, 0x45, 0x00];
  static const _center = [0x1B, 0x61, 0x01];
  static const _left = [0x1B, 0x61, 0x00];
  static const _underline = [0x1B, 0x2D, 0x01];
  static const _underlineOff = [0x1B, 0x2D, 0x00];
  static const _feedLine = [0x0A];
  static const _feedLines = [0x1B, 0x64, 0x03];
  static const _fontNormal = [0x1B, 0x21, 0x00];
  static const _fontLarge = [0x1B, 0x21, 0x10];

  EscPosBuilder() {
    _bytes.addAll(_init);
  }

  EscPosBuilder text(String text, {bool bold = false, bool center = false, bool underline = false, bool large = false}) {
    if (center) _bytes.addAll(_center);
    if (underline) _bytes.addAll(_underline);
    if (bold) _bytes.addAll(_boldOn);
    if (large) _bytes.addAll(_fontLarge);
    _bytes.addAll(text.codeUnits);
    if (large) _bytes.addAll(_fontNormal);
    if (bold) _bytes.addAll(_boldOff);
    if (underline) _bytes.addAll(_underlineOff);
    if (center) _bytes.addAll(_left);
    _bytes.addAll(_feedLine);
    return this;
  }

  EscPosBuilder dashedLine() {
    _bytes.addAll(_left);
    _bytes.addAll(List.filled(32, 0x2D));
    _bytes.addAll(_feedLine);
    return this;
  }

  EscPosBuilder doubleDashedLine() {
    _bytes.addAll(_left);
    _bytes.addAll(List.filled(32, 0x3D));
    _bytes.addAll(_feedLine);
    return this;
  }

  EscPosBuilder lineItem(String name, String value, {bool bold = false}) {
    _bytes.addAll(_left);
    if (bold) _bytes.addAll(_boldOn);
    final nameBytes = name.codeUnits;
    final valueBytes = value.codeUnits;
    final padding = 32 - nameBytes.length - valueBytes.length;
    _bytes.addAll(nameBytes);
    if (padding > 0) _bytes.addAll(List.filled(padding, 0x20));
    _bytes.addAll(valueBytes);
    if (bold) _bytes.addAll(_boldOff);
    _bytes.addAll(_feedLine);
    return this;
  }

  EscPosBuilder divider() {
    _bytes.addAll(_feedLine);
    return this;
  }

  Uint8List build() {
    _bytes.addAll(_feedLines);
    _bytes.addAll(_cut);
    return Uint8List.fromList(_bytes);
  }

  Uint8List buildRaw() {
    return Uint8List.fromList(_bytes);
  }
}
