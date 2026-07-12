import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/app_state.dart';
import '../../../core/hardware/printer_service.dart';
import '../../../core/sync/offline_sync_service.dart';

class PrinterDiagnosticScreen extends StatefulWidget {
  const PrinterDiagnosticScreen({super.key});

  @override
  State<PrinterDiagnosticScreen> createState() => _PrinterDiagnosticScreenState();
}

class _PrinterDiagnosticScreenState extends State<PrinterDiagnosticScreen> {
  late final PrinterService _printer;
  late final AppState _appState;
  StreamSubscription? _syncSub;
  SyncStatus _syncStatus = SyncStatus.idle;
  int _pendingCount = 0;

  // Connection tests
  bool _receiptConnected = false;
  bool _kotConnected = false;
  bool _testingReceipt = false;
  bool _testingKot = false;
  bool _testingDrawer = false;
  bool _discovering = false;
  List<DiscoveredPrinter> _discoveredPrinters = [];
  bool _showDiagnostics = false;

  @override
  void initState() {
    super.initState();
    _printer = PrinterService();
    _appState = context.read<AppState>();
    _printer.loadSettings();
    _checkConnections();
    _loadPendingCount();

    _syncSub = _appState.sync.statusStream.listen((status) {
      if (mounted) {
        setState(() => _syncStatus = status);
        _loadPendingCount();
      }
    });
  }

  Future<void> _loadPendingCount() async {
    final count = await _appState.sync.getPendingCount();
    if (mounted) setState(() => _pendingCount = count);
  }

  Future<void> _checkConnections() async {
    final receipt = await _printer.checkPrinterConnection();
    final kot = await _printer.checkKotPrinterConnection();
    if (mounted) {
      setState(() {
        _receiptConnected = receipt;
        _kotConnected = kot;
      });
    }
  }

  Future<void> _runDiscovery() async {
    setState(() => _discovering = true);
    final printers = await _printer.discoverPrinters();
    if (mounted) {
      setState(() {
        _discoveredPrinters = printers;
        _discovering = false;
      });
    }
    if (printers.isNotEmpty && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Found ${printers.length} printer(s) on network'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  Future<void> _testReceipt() async {
    setState(() => _testingReceipt = true);
    final success = await _printer.testPrinter();
    if (mounted) {
      setState(() => _testingReceipt = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success ? 'Receipt test printed!' : 'Receipt printer not reachable'),
          backgroundColor: success ? AppColors.success : AppColors.danger,
        ),
      );
    }
  }

  Future<void> _testKot() async {
    setState(() => _testingKot = true);
    final success = await _printer.testKotPrinter();
    if (mounted) {
      setState(() => _testingKot = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success ? 'KOT test printed!' : 'KOT printer not reachable'),
          backgroundColor: success ? AppColors.success : AppColors.danger,
        ),
      );
    }
  }

  Future<void> _testCashDrawer() async {
    setState(() => _testingDrawer = true);
    final success = await _printer.openCashDrawer();
    if (mounted) {
      setState(() => _testingDrawer = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success ? 'Cash drawer opened!' : 'Cash drawer command failed'),
          backgroundColor: success ? AppColors.success : AppColors.danger,
        ),
      );
    }
  }

  @override
  void dispose() {
    _syncSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Printer Diagnostics'),
        actions: [
          IconButton(
            onPressed: () => setState(() => _showDiagnostics = !_showDiagnostics),
            icon: Icon(_showDiagnostics ? Icons.bug_report : Icons.info_outline),
            tooltip: 'Toggle raw diagnostics',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ─── Printer Connection Status ───
            Text('Connection Status', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _buildConnectionCard(
              'Receipt Printer',
              '${_printer.printerIp}:${_printer.printerPort}',
              _receiptConnected,
              _testingReceipt,
              _testReceipt,
            ),
            const SizedBox(height: 10),
            _buildConnectionCard(
              'Kitchen (KOT) Printer',
              '${_printer.kotPrinterIp}:${_printer.kotPrinterPort}',
              _kotConnected,
              _testingKot,
              _testKot,
            ),
            const SizedBox(height: 16),

            // ─── Hardware Tests ───
            Text('Hardware Tests', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _testingDrawer ? null : _testCashDrawer,
                    icon: _testingDrawer
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.countertops, size: 18),
                    label: const Text('Cash Drawer'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // ─── Network Auto-Discovery ───
            Text('Auto-Detect Printers', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(
              'Scans local network for printers on port 9100',
              style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _discovering ? null : _runDiscovery,
                icon: _discovering
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.wifi_find, size: 18),
                label: Text(_discovering ? 'Scanning network...' : 'Scan Network for Printers'),
              ),
            ),
            if (_discovering)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: LinearProgressIndicator(),
              ),
            if (_discoveredPrinters.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.gray200),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(12),
                      child: Text(
                        'Found ${_discoveredPrinters.length} printer(s):',
                        style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                    ),
                    const Divider(height: 1),
                    ..._discoveredPrinters.map((p) => ListTile(
                      dense: true,
                      leading: const Icon(Icons.print, size: 20, color: AppColors.success),
                      title: Text(p.ip, style: GoogleFonts.inter(fontSize: 13)),
                      subtitle: Text('Port ${p.port} | ${p.responseTimeMs}ms response time', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
                      trailing: TextButton(
                        onPressed: () {
                          _printer.saveSettings(
                            type: PrinterType.network,
                            ip: p.ip,
                            port: p.port,
                          );
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Printer configured')),
                          );
                          _checkConnections();
                        },
                        child: const Text('Use', style: TextStyle(fontSize: 12)),
                      ),
                    )),
                  ],
                ),
              ),
            ],
            if (_discoveredPrinters.isEmpty && !_discovering) ...[
              const SizedBox(height: 8),
              Text('No printers found. Make sure they are on the same network.', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray400)),
            ],
            const SizedBox(height: 24),

            // ─── Sync Status ───
            Text('Sync Status', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _buildSyncStatusCard(),
            const SizedBox(height: 24),

            // ─── Raw Diagnostics (toggleable) ───
            if (_showDiagnostics) ...[
              Text('Raw Diagnostics', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              _buildRawDiagnosticCard(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildConnectionCard(
    String title,
    String address,
    bool connected,
    bool testing,
    VoidCallback onTest,
  ) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.gray200),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: connected ? AppColors.success.withValues(alpha: 0.1) : AppColors.danger.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              connected ? Icons.check_circle : Icons.error_outline,
              color: connected ? AppColors.success : AppColors.danger,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                Text(address, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
              ],
            ),
          ),
          Text(
            connected ? 'Online' : 'Offline',
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: connected ? AppColors.success : AppColors.danger,
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            height: 32,
            child: OutlinedButton(
              onPressed: testing ? null : onTest,
              child: testing
                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Test', style: TextStyle(fontSize: 11)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSyncStatusCard() {
    Color statusColor;
    String statusText;
    IconData statusIcon;

    switch (_syncStatus) {
      case SyncStatus.syncing:
        statusColor = AppColors.warning;
        statusText = 'Syncing...';
        statusIcon = Icons.sync;
      case SyncStatus.synced:
        statusColor = AppColors.success;
        statusText = _pendingCount > 0 ? '$_pendingCount pending' : 'All synced';
        statusIcon = Icons.cloud_done;
      case SyncStatus.error:
        statusColor = AppColors.danger;
        statusText = '$_pendingCount pending — will retry';
        statusIcon = Icons.cloud_off;
      case SyncStatus.idle:
        statusColor = _pendingCount > 0 ? AppColors.warning : AppColors.gray500;
        statusText = _pendingCount > 0 ? '$_pendingCount pending' : 'Idle';
        statusIcon = _pendingCount > 0 ? Icons.cloud_upload : Icons.cloud_queue;
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.gray200),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(statusIcon, color: statusColor, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Sync Engine', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                    Text(statusText, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                  ],
                ),
              ),
              if (_syncStatus == SyncStatus.syncing)
                const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _syncDetailChip('Pending', '$_pendingCount', AppColors.warning),
              const SizedBox(width: 8),
              _syncDetailChip('Online', _appState.isOnline ? 'Yes' : 'No', _appState.isOnline ? AppColors.success : AppColors.danger),
            ],
          ),
        ],
      ),
    );
  }

  Widget _syncDetailChip(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('$label: ', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
          Text(value, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
        ],
      ),
    );
  }

  Widget _buildRawDiagnosticCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.gray900,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _diagLine('Printer Type', _printer.printerType == PrinterType.network ? 'Network' : 'USB'),
          _diagLine('Receipt IP', _printer.printerIp),
          _diagLine('Receipt Port', '${_printer.printerPort}'),
          _diagLine('KOT IP', _printer.kotPrinterIp),
          _diagLine('KOT Port', '${_printer.kotPrinterPort}'),
          _diagLine('Receipt Connected', '$_receiptConnected'),
          _diagLine('KOT Connected', '$_kotConnected'),
          _diagLine('Sync Status', '$_syncStatus'),
          _diagLine('Pending Count', '$_pendingCount'),
        ],
      ),
    );
  }

  Widget _diagLine(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Text(
            '$label: ',
            style: GoogleFonts.jetBrainsMono(fontSize: 11, color: AppColors.gray400),
          ),
          Text(
            value,
            style: GoogleFonts.jetBrainsMono(fontSize: 11, color: AppColors.gray200),
          ),
        ],
      ),
    );
  }
}
