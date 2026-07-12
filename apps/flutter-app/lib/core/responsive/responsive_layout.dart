enum DeviceType { mobile, tablet, desktop, largeDesktop, tv }

class AppBreakpoints {
  static const double mobile = 600;
  static const double tablet = 1024;
  static const double desktop = 1440;
  static const double largeDesktop = 1920;
  static const double tv = 2560;

  static DeviceType getDeviceType(double width) {
    if (width < mobile) return DeviceType.mobile;
    if (width < tablet) return DeviceType.tablet;
    if (width < desktop) return DeviceType.desktop;
    if (width < largeDesktop) return DeviceType.largeDesktop;
    return DeviceType.tv;
  }
}

class ResponsiveLayout extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget desktop;
  final Widget? tv;

  const ResponsiveLayout({
    super.key,
    required this.mobile,
    this.tablet,
    required this.desktop,
    this.tv,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final deviceType = AppBreakpoints.getDeviceType(constraints.maxWidth);

        switch (deviceType) {
          case DeviceType.mobile:
            return mobile;
          case DeviceType.tablet:
            return tablet ?? mobile;
          case DeviceType.desktop:
          case DeviceType.largeDesktop:
            return desktop;
          case DeviceType.tv:
            return tv ?? desktop;
        }
      },
    );
  }
}
