import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/riverpod_providers.dart';

class CreateCampaignScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic>? campaign;
  const CreateCampaignScreen({super.key, this.campaign});
  @override
  ConsumerState<CreateCampaignScreen> createState() => _CreateCampaignScreenState();
}

class _CreateCampaignScreenState extends ConsumerState<CreateCampaignScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameCtrl;
  late TextEditingController _descCtrl;
  String? _type;
  String _channel = 'Email';
  String? _templateId;
  Set<String> _selectedAudienceIds = {};
  DateTime? _scheduleDate;
  bool _launchImmediately = true;

  bool get _isEditing => widget.campaign != null;

  static const _types = [
    'Promotional',
    'Seasonal',
    'Festival',
    'Re-engagement',
    'Birthday',
    'Anniversary',
    'Feedback',
  ];

  @override
  void initState() {
    super.initState();
    final c = widget.campaign;
    _nameCtrl = TextEditingController(text: c?['name'] ?? '');
    _descCtrl = TextEditingController(text: c?['description'] ?? '');
    _type = c?['type'];
    _channel = c?['channel'] ?? 'Email';
    _templateId = c?['templateId'];
    _launchImmediately = c?['launchImmediately'] ?? true;
    if (c?['scheduleDate'] != null) {
      _scheduleDate = DateTime.tryParse((c?['scheduleDate'] as String?) ?? '');
      if (_scheduleDate != null) _launchImmediately = false;
    }
    final audienceIds = c?['audienceIds'] as List<dynamic>?;
    if (audienceIds != null) {
      _selectedAudienceIds = audienceIds.map((e) => e.toString()).toSet();
    }
    final mp = ref.read(marketingProvider.notifier);
    mp.loadTemplates();
    mp.loadAudiences();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _scheduleDate ?? DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) setState(() => _scheduleDate = picked);
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    if (_type == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a campaign type')),
      );
      return;
    }

    final mp = ref.read(marketingProvider.notifier);
    final data = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'description': _descCtrl.text.trim(),
      'type': _type,
      'channel': _channel,
      'templateId': _templateId,
      'audienceIds': _selectedAudienceIds.toList(),
      'launchImmediately': _launchImmediately,
      if (!_launchImmediately && _scheduleDate != null)
        'scheduleDate': _scheduleDate!.toIso8601String(),
    };

    if (_isEditing) {
      mp.updateCampaign(widget.campaign!['id'], data);
    } else {
      mp.createCampaign(data);
    }
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final mp = ref.watch(marketingProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text(
          _isEditing ? 'Edit Campaign' : 'Create Campaign',
          style: GoogleFonts.inter(fontWeight: FontWeight.w600),
        ),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _nameCtrl,
                decoration: const InputDecoration(labelText: 'Campaign Name *'),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _descCtrl,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  alignLabelWithHint: true,
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 14),
              DropdownButtonFormField<String>(
                initialValue: _type,
                decoration: const InputDecoration(labelText: 'Type *'),
                items: _types
                    .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                    .toList(),
                onChanged: (v) => setState(() => _type = v),
              ),
              const SizedBox(height: 14),
              Text('Channel', style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 13)),
              const SizedBox(height: 6),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'Email', label: Text('Email'), icon: Icon(Icons.email_outlined, size: 18)),
                  ButtonSegment(value: 'SMS', label: Text('SMS'), icon: Icon(Icons.sms_outlined, size: 18)),
                  ButtonSegment(value: 'Both', label: Text('Both'), icon: Icon(Icons.compare_arrows, size: 18)),
                ],
                selected: {_channel},
                onSelectionChanged: (v) => setState(() => _channel = v.first),
              ),
              const SizedBox(height: 14),
              DropdownButtonFormField<String>(
                initialValue: _templateId,
                decoration: const InputDecoration(labelText: 'Template'),
                items: [
                  const DropdownMenuItem(value: null, child: Text('None')),
                  ...mp.templates.map((t) => DropdownMenuItem(
                        value: t['id'] as String?,
                        child: Text(t['name'] ?? 'Unnamed'),
                      )),
                ],
                onChanged: (v) => setState(() => _templateId = v),
              ),
              const SizedBox(height: 14),
              Text('Audience Segments', style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 13)),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: mp.audiences.map((a) {
                  final id = a['id'] as String? ?? '';
                  final selected = _selectedAudienceIds.contains(id);
                  return FilterChip(
                    label: Text(a['name'] ?? 'Unnamed', style: GoogleFonts.inter(fontSize: 12)),
                    selected: selected,
                    onSelected: (v) {
                      setState(() {
                        if (v) {
                          _selectedAudienceIds.add(id);
                        } else {
                          _selectedAudienceIds.remove(id);
                        }
                      });
                    },
                  );
                }).toList(),
              ),
              if (mp.audiences.isEmpty)
                Text('No audience segments available',
                    style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray400)),
              const SizedBox(height: 16),
              SwitchListTile(
                title: Text('Launch immediately', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                value: _launchImmediately,
                onChanged: (v) => setState(() => _launchImmediately = v),
                contentPadding: EdgeInsets.zero,
              ),
              if (!_launchImmediately) ...[
                const SizedBox(height: 8),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.calendar_today),
                  title: Text(
                    _scheduleDate != null
                        ? '${_scheduleDate!.day}/${_scheduleDate!.month}/${_scheduleDate!.year}'
                        : 'Select schedule date',
                    style: GoogleFonts.inter(
                      color: _scheduleDate != null ? null : AppColors.gray400,
                    ),
                  ),
                  trailing: TextButton(
                    onPressed: _pickDate,
                    child: const Text('Pick Date'),
                  ),
                ),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: mp.loading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(44),
                ),
                child: mp.loading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text(_isEditing ? 'Update Campaign' : 'Create Campaign'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
