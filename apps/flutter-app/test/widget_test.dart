import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexaros_app/core/theme/app_theme.dart';
import 'package:nexaros_app/core/responsive/responsive_layout.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('AppColors', () {
    test('orderStatusColor returns correct colors', () {
      expect(AppColors.orderStatusColor('PENDING'), AppColors.orderPending);
      expect(AppColors.orderStatusColor('READY'), AppColors.orderReady);
      expect(AppColors.orderStatusColor('UNKNOWN'), AppColors.gray400);
    });

    test('tableStatusColor returns correct colors', () {
      expect(AppColors.tableStatusColor('FREE'), AppColors.tableFree);
      expect(AppColors.tableStatusColor('OCCUPIED'), AppColors.tableOccupied);
    });

    test('forBrightness selects correct color', () {
      expect(
        AppColors.forBrightness(Brightness.light, light: Colors.white, dark: Colors.black),
        Colors.white,
      );
      expect(
        AppColors.forBrightness(Brightness.dark, light: Colors.white, dark: Colors.black),
        Colors.black,
      );
    });
  });

  group('AppBreakpoints', () {
    test('returns correct device type', () {
      expect(AppBreakpoints.getDeviceType(300), DeviceType.mobile);
      expect(AppBreakpoints.getDeviceType(700), DeviceType.tablet);
      expect(AppBreakpoints.getDeviceType(1200), DeviceType.desktop);
      expect(AppBreakpoints.getDeviceType(1500), DeviceType.largeDesktop);
      expect(AppBreakpoints.getDeviceType(2000), DeviceType.tv);
    });
  });

  // AppTheme tests require network for Google Fonts loading — skip in CI.
}
