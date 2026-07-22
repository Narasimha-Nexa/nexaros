import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  Map<String, dynamic>? _profile;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final api = ref.read(appStateProvider).api;
      final data = await api.getProfile();
      if (mounted) {
        setState(() {
          _profile = data['user'] as Map<String, dynamic>? ?? data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final rp = ref.watch(roleProvider);
    final ap = ref.watch(authProvider);
    final tp = ref.watch(themeProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: _isLoading
          ? const NxFullScreenLoader()
          : _error != null
              ? NxErrorView(message: _error!, onRetry: _loadProfile)
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(AppDimens.base),
                  child: Column(
                    children: [
                      // Avatar + name
                      NxAvatar(
                        name: _profile?['firstName'] != null
                            ? '${_profile!['firstName']} ${_profile!['lastName'] ?? ''}'
                            : rp.state.name,
                        size: 80,
                      ),
                      const SizedBox(height: AppDimens.base),
                      Text(
                        rp.state.name ?? 'User',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: cs.onSurface,
                        ),
                      ),
                      const SizedBox(height: AppDimens.xxs),
                      Text(
                        _profile?['email'] ?? rp.state.email ?? '',
                        style: TextStyle(fontSize: 14, color: AppColors.gray400),
                      ),
                      const SizedBox(height: AppDimens.xxs),
                      NxStatusBadge(
                        label: rp.state.role.label,
                        color: AppColors.primary,
                      ),
                      const SizedBox(height: AppDimens.xl),
                      const Divider(),
                      // Account section
                      _Section(title: 'Account'),
                      _ProfileTile(
                        icon: Icons.person_outline,
                        title: 'Edit Profile',
                        subtitle: 'Update your name, photo, and details',
                        onTap: () {},
                      ),
                      _ProfileTile(
                        icon: Icons.lock_outline,
                        title: 'Change Password',
                        subtitle: 'Update your account password',
                        onTap: () {},
                      ),
                      _ProfileTile(
                        icon: Icons.store_outlined,
                        title: 'Branch',
                        subtitle: _profile?['branch']?['name'] ?? 'Main Branch',
                        onTap: () => context.push('/branches'),
                      ),
                      const Divider(),
                      // Preferences
                      _Section(title: 'Preferences'),
                      _ProfileTile(
                        icon: Icons.print_outlined,
                        title: 'Printer Settings',
                        subtitle: 'Configure receipt printer',
                        onTap: () => context.push('/printer-settings'),
                      ),
                      _ProfileTile(
                        icon: Icons.language,
                        title: 'Language',
                        subtitle: 'English',
                        onTap: () {},
                      ),
                      // Theme toggle
                      SwitchListTile(
                        secondary: Icon(
                          tp.themeMode == ThemeMode.dark
                              ? Icons.dark_mode
                              : Icons.light_mode,
                          color: AppColors.gray500,
                        ),
                        title: Text(
                          'Dark Mode',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: cs.onSurface),
                        ),
                        subtitle: Text(
                          tp.themeMode == ThemeMode.dark ? 'On' : 'Off',
                          style: TextStyle(fontSize: 12, color: AppColors.gray400),
                        ),
                        value: tp.themeMode == ThemeMode.dark,
                        onChanged: (_) => tp.toggle(Theme.of(context).brightness),
                      ),
                      const Divider(),
                      // Subscription
                      _Section(title: 'Subscription'),
                      _ProfileTile(
                        icon: Icons.card_membership,
                        title: 'Manage Subscription',
                        subtitle: 'View plan and billing',
                        onTap: () => context.push('/subscription'),
                      ),
                      const Divider(),
                      const SizedBox(height: AppDimens.base),
                      // Logout
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: () async {
                            final confirmed = await NxConfirmationDialog.show(
                              context: context,
                              title: 'Logout',
                              message: 'Are you sure you want to logout?',
                              confirmLabel: 'Logout',
                            );
                            if (confirmed == true && mounted) {
                              final appState = ref.read(appStateProvider);
                              appState.onLogout();
                              rp.reset();
                              await ap.logout();
                              if (mounted) context.go('/login');
                            }
                          },
                          icon: const Icon(Icons.logout, color: AppColors.danger),
                          label: const Text('Logout', style: TextStyle(color: AppColors.danger)),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: AppColors.danger),
                          ),
                        ),
                      ),
                      const SizedBox(height: AppDimens.xxl),
                    ],
                  ),
                ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  const _Section({required this.title});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
        child: Text(
          title,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.gray400,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }
}

class _ProfileTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _ProfileTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return ListTile(
      leading: Icon(icon, color: AppColors.gray500, size: 22),
      title: Text(title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: cs.onSurface)),
      subtitle: Text(subtitle, style: TextStyle(fontSize: 12, color: AppColors.gray400)),
      trailing: const Icon(Icons.chevron_right, size: 20),
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 4),
    );
  }
}
