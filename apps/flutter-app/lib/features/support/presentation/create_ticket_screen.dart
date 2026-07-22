import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';

class CreateTicketScreen extends ConsumerStatefulWidget {
  const CreateTicketScreen({super.key});
  @override
  ConsumerState<CreateTicketScreen> createState() => _CreateTicketScreenState();
}

class _CreateTicketScreenState extends ConsumerState<CreateTicketScreen> {
  final _subjectCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String _priority = 'NORMAL';
  bool _submitting = false;

  @override
  void dispose() {
    _subjectCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Create Ticket', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Subject', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            TextField(controller: _subjectCtrl, decoration: const InputDecoration(hintText: 'Brief description of your issue')),
            const SizedBox(height: 16),
            Text('Description', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            TextField(controller: _descCtrl, decoration: const InputDecoration(hintText: 'Detailed explanation...'), maxLines: 5),
            const SizedBox(height: 16),
            Text('Priority', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'LOW', label: Text('Low')),
                ButtonSegment(value: 'NORMAL', label: Text('Normal')),
                ButtonSegment(value: 'HIGH', label: Text('High')),
                ButtonSegment(value: 'URGENT', label: Text('Urgent')),
              ],
              selected: {_priority},
              onSelectionChanged: (v) => setState(() => _priority = v.first),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: _submitting ? null : _submit,
                icon: _submitting ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.send),
                label: Text(_submitting ? 'Submitting...' : 'Submit Ticket'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (_subjectCtrl.text.trim().isEmpty || _descCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill in all fields')));
      return;
    }
    setState(() => _submitting = true);
    final success = await ref.read(supportProvider).createTicket(
      subject: _subjectCtrl.text.trim(),
      description: _descCtrl.text.trim(),
      priority: _priority,
    );
    setState(() => _submitting = false);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Ticket created!'), backgroundColor: AppColors.success));
      Navigator.pop(context);
    }
  }
}
