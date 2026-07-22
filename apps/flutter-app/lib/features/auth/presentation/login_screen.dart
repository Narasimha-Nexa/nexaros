import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController(text: 'admin@demo.com');
  final _passwordController = TextEditingController(text: 'password123');
  bool _obscurePassword = true;
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final provider = ref.read(authProvider.notifier);
      await provider.login(_emailController.text, _passwordController.text);

      if (provider.state.status == AuthStatus.authenticated && mounted) {
        // Initialize role from login response + JWT
        try {
          final roleProv = ref.read(roleProvider.notifier);
          roleProv.setFromLogin(
            provider.state.user ?? {},
            ref.read(appStateProvider).api.accessToken ?? '',
          );
        } catch (_) {}

        // Load branches via BranchProvider
        try {
          final appState = ref.read(appStateProvider);
          final branchProv = ref.read(branchProvider.notifier);
          await branchProv.loadBranches();
          final branchId = branchProv.selectedBranchId;
          if (branchId != null) {
            appState.onLogin(branchId);
            appState.api.setBranchId(branchId);
          }
        } catch (_) {}

        // Load subscription entitlements after login
        if (mounted) {
          try {
            final subscription = ref.read(subscriptionProvider.notifier);
            await subscription.loadEntitlements();
            subscription.startPeriodicRefresh();
          } catch (_) {}
        }

        if (!mounted) return;
        context.go('/shell/dashboard');
      } else if (mounted) {
        setState(() => _error = provider.state.error ?? 'Login failed');
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString().replaceAll('Exception: ', ''));
    }

    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Icon(Icons.restaurant, size: 64, color: AppColors.primary),
                const SizedBox(height: 16),
                Text(
                  'NexaROS',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface),
                ),
                const SizedBox(height: 8),
                Text(
                  'AI-Powered Restaurant Operating System',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(fontSize: 14, color: AppColors.gray500),
                ),
                const SizedBox(height: 40),

                if (_error != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.danger.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
                    ),
                    child: Text(_error!, style: TextStyle(color: AppColors.danger, fontSize: 13)),
                  ),

                TextField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined, size: 20)),
                ),
                const SizedBox(height: 16),

                TextField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    prefixIcon: const Icon(Icons.lock_outlined, size: 20),
                    suffixIcon: IconButton(
                      icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility, size: 20),
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                SizedBox(
                  height: 48,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleLogin,
                    child: _isLoading
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.white))
                        : const Text('Sign In'),
                  ),
                ),
                const SizedBox(height: 24),

                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      Text('Demo Credentials', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primary)),
                      const SizedBox(height: 4),
                      Text('Email: admin@demo.com\nPassword: password123',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray600)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
