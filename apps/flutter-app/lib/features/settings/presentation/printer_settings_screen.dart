import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/hardware/printer_service.dart';
import 'printer_diagnostic_screen.dart';

class PrinterSettingsScreen extends StatefulWidget {
  const PrinterSettingsScreen({super.key});

  @override
  State<PrinterSettingsScreen> createState() => _PrinterSettingsScreenState();
}

class _PrinterSettingsScreenState extends State<PrinterSettingsScreen> {
  final _printerService = PrinterService();
  final _ipController = TextEditingController();
  final _portController = TextEditingController();
  final _kotIpController = TextEditingController();
  final _kotPortController = TextEditingController();
  PrinterType _printerType = PrinterType.network;
  bool _isLoading = true;
  bool _isTesting = false;
  bool _receiptConnected = false;
  bool _kotConnected = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    await _printerService.loadSettings();
    setState(() {
      _printerType = _printerService.printerType;
      _ipController.text = _printerService.printerIp;
      _portController.text = _printerService.printerPort.toString();
      _kotIpController.text = _printerService.kotPrinterIp;
      _kotPortController.text = _printerService.kotPrinterPort.toString();
      _isLoading = false;
    });
    _checkConnections();
  }

  Future<void> _checkConnections() async {
    final receipt = await _printerService.checkPrinterConnection();
    final kot = await _printerService.checkKotPrinterConnection();
    setState(() {
      _receiptConnected = receipt;
      _kotConnected = kot;
    });
  }

  Future<void> _saveSettings() async {
    await _printerService.saveSettings(
      type: _printerType,
      ip: _ipController.text.trim(),
      port: int.tryParse(_portController.text.trim()) ?? 9100,
      kotIp: _kotIpController.text.trim(),
      kotPort: int.tryParse(_kotPortController.text.trim()) ?? 9100,
    );
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Settings saved'), backgroundColor: Colors.green),
      );
    }
    _checkConnections();
  }

  Future<void> _testReceipt() async {
    setState(() => _isTesting = true);
    final success = await _printerService.testPrinter();
    setState(() => _isTesting = false);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success ? 'Test receipt printed!' : 'Printer not reachable'),
          backgroundColor: success ? Colors.green : Colors.red,
        ),
      );
    }
  }

  Future<void> _testKot() async {
    setState(() => _isTesting = true);
    final success = await _printerService.testKotPrinter();
    setState(() => _isTesting = false);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success ? 'KOT test printed!' : 'KOT printer not reachable'),
          backgroundColor: success ? Colors.green : Colors.red,
        ),
      );
    }
  }

  @override
  void dispose() {
    _ipController.dispose();
    _portController.dispose();
    _kotIpController.dispose();
    _kotPortController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Printer Settings'),
        actions: [
          IconButton(
            icon: const Icon(Icons.bug_report),
            tooltip: 'Diagnostics',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const PrinterDiagnosticScreen()),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Printer Type
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Printer Type', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    SegmentedButton<PrinterType>(
                      segments: const [
                        ButtonSegment(value: PrinterType.network, label: Text('Network')),
                        ButtonSegment(value: PrinterType.usb, label: Text('USB')),
                      ],
                      selected: {_printerType},
                      onSelectionChanged: (s) => setState(() => _printerType = s.first),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Receipt Printer
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text('Receipt Printer', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: _receiptConnected ? Colors.green.shade50 : Colors.red.shade50,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                _receiptConnected ? Icons.check_circle : Icons.error,
                                size: 14,
                                color: _receiptConnected ? Colors.green : Colors.red,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                _receiptConnected ? 'Connected' : 'Offline',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: _receiptConnected ? Colors.green : Colors.red,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _ipController,
                      decoration: const InputDecoration(labelText: 'IP Address', hintText: '192.168.1.100'),
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _portController,
                      decoration: const InputDecoration(labelText: 'Port', hintText: '9100'),
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: _isTesting ? null : _testReceipt,
                        icon: _isTesting
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.print, size: 18),
                        label: const Text('Test Print'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // KOT Printer
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text('KOT Printer (Kitchen)', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: _kotConnected ? Colors.green.shade50 : Colors.red.shade50,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                _kotConnected ? Icons.check_circle : Icons.error,
                                size: 14,
                                color: _kotConnected ? Colors.green : Colors.red,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                _kotConnected ? 'Connected' : 'Offline',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: _kotConnected ? Colors.green : Colors.red,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _kotIpController,
                      decoration: const InputDecoration(labelText: 'IP Address', hintText: '192.168.1.101'),
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _kotPortController,
                      decoration: const InputDecoration(labelText: 'Port', hintText: '9100'),
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: _isTesting ? null : _testKot,
                        icon: _isTesting
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.print, size: 18),
                        label: const Text('Test KOT Print'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Save Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _saveSettings,
                child: const Text('Save Settings'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
