import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../pos/data/pos_models.dart';

class ReceiptPreviewScreen extends ConsumerStatefulWidget {
  final String? orderId;
  final int? orderNumber;
  final List<CartItem>? items;
  final PaymentBreakdown? billing;
  final String? tableName;
  final String? orderType;
  final PosReceiptConfig? config;

  const ReceiptPreviewScreen({
    super.key,
    this.orderId,
    this.orderNumber,
    this.items,
    this.billing,
    this.tableName,
    this.orderType,
    this.config,
  });

  @override
  ConsumerState<ReceiptPreviewScreen> createState() => _ReceiptPreviewScreenState();
}

class _ReceiptPreviewScreenState extends ConsumerState<ReceiptPreviewScreen> {
  Uint8List? _receiptBytes;
  bool _isGenerating = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _generateReceipt();
  }

  Future<void> _generateReceipt() async {
    setState(() {
      _isGenerating = true;
      _error = null;
    });

    try {
      final posService = ref.read(posProvider.notifier).service;

      final items = widget.items ?? [];
      final billing = widget.billing ?? posService.calculateBill(
        cart: Cart(id: 'preview'),
        taxConfig: widget.config != null ? PosTaxConfig() : PosTaxConfig(),
      );

      final bytes = posService.generateReceipt(
        restaurantName: widget.config?.restaurantName ?? 'NexaROS',
        branchName: widget.config?.branchName ?? 'Main Branch',
        orderNumber: widget.orderNumber ?? 12345,
        items: items,
        billing: billing,
        config: widget.config ?? const PosReceiptConfig(restaurantName: '', branchName: ''),
        tableName: widget.tableName,
        orderType: widget.orderType ?? 'DINE_IN',
      );

      if (mounted) {
        setState(() {
          _receiptBytes = Uint8List.fromList(bytes);
          _isGenerating = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isGenerating = false;
        });
      }
    }
  }

  Future<void> _reprint() async {
    setState(() => _isGenerating = true);
    try {
      final printer = ref.read(appStateProvider).printer;
      if (_receiptBytes != null) {
        await printer.printReceipt(_receiptBytes!);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Receipt sent to printer'), backgroundColor: AppColors.success),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Print failed: $e'), backgroundColor: AppColors.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _isGenerating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text('Receipt Preview', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        backgroundColor: cs.surface,
        elevation: 0,
        actions: [
          if (_receiptBytes != null)
            IconButton(
              icon: const Icon(Icons.print, size: 22),
              onPressed: _isGenerating ? null : _reprint,
              tooltip: 'Print Receipt',
            ),
          IconButton(
            icon: const Icon(Icons.refresh, size: 22),
            onPressed: _isGenerating ? null : _generateReceipt,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _buildBody(cs),
    );
  }

  Widget _buildBody(ColorScheme cs) {
    if (_isGenerating) {
      return const NxFullScreenLoader(message: 'Generating receipt...');
    }

    if (_error != null) {
      return NxErrorView(
        message: _error!,
        onRetry: _generateReceipt,
      );
    }

    if (_receiptBytes == null) {
      return NxEmptyState(
        icon: Icons.receipt_long,
        title: 'No Receipt',
        subtitle: 'No receipt data available',
        actionLabel: 'Generate',
        onAction: _generateReceipt,
      );
    }

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 400),
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: cs.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: cs.outlineVariant),
                boxShadow: [BoxShadow(color: cs.shadow.withValues(alpha: 0.1), blurRadius: 8, offset: const Offset(0, 2))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.receipt_long, color: cs.primary, size: 28),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Order #${widget.orderNumber ?? '—'}', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 16)),
                            if (widget.tableName != null)
                              Text('Table: ${widget.tableName}', style: GoogleFonts.inter(fontSize: 13, color: cs.outline)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(height: 1),
                  const SizedBox(height: 16),
                  _buildReceiptPreview(cs),
                  const SizedBox(height: 16),
                  const Divider(height: 1),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _isGenerating ? null : _generateReceipt,
                          icon: const Icon(Icons.refresh, size: 18),
                          label: Text('Regenerate', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                          style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 12)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _isGenerating ? null : _reprint,
                          icon: _isGenerating ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.print, size: 18),
                          label: Text('Print Receipt', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReceiptPreview(ColorScheme cs) {
    return SingleChildScrollView(
      child: SelectableText(
        String.fromCharCodes(_receiptBytes!),
        style: GoogleFonts.robotoMono(fontSize: 10, color: cs.onSurface),
      ),
    );
  }
}
