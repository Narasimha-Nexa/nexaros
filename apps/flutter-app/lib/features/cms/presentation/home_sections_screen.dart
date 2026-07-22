import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/riverpod_providers.dart';

class HomeSectionsScreen extends ConsumerStatefulWidget {
  const HomeSectionsScreen({super.key});
  @override
  ConsumerState<HomeSectionsScreen> createState() => _HomeSectionsScreenState();
}

class _HomeSectionsScreenState extends ConsumerState<HomeSectionsScreen> {
  List<Map<String, dynamic>> _sections = [];
  bool _initialized = false;

  static const _sectionTypes = ['hero', 'featured', 'categories', 'testimonials', 'gallery', 'cta'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _initFromProvider());
  }

  void _initFromProvider() {
    if (_initialized) return;
    final cms = ref.read(cmsProvider.notifier);
    _sections = cms.sections.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    _initialized = true;
  }

  Future<void> _saveOrder() async {
    final cms = ref.read(cmsProvider.notifier);
    final ordered = _sections.asMap().entries.map((e) {
      e.value['sortOrder'] = e.key;
      return e.value;
    }).toList();
    await cms.updateSections(ordered);
    if (mounted) {
      if (cms.error != null) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(cms.error!), backgroundColor: AppColors.danger));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Section order saved'), backgroundColor: AppColors.success));
      }
    }
  }

  void _addSection() {
    showDialog(
      context: context,
      builder: (ctx) {
        String selectedType = _sectionTypes.first;
        return AlertDialog(
          title: Text('Add Section', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
          content: Column(mainAxisSize: MainAxisSize.min, children: [
            DropdownButtonFormField<String>(
              initialValue: selectedType,
              decoration: const InputDecoration(labelText: 'Section Type', border: OutlineInputBorder()),
              items: _sectionTypes.map((t) => DropdownMenuItem(value: t, child: Text(t, style: GoogleFonts.inter()))).toList(),
              onChanged: (v) => selectedType = v!,
            ),
          ]),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.gray500))),
            TextButton(
              onPressed: () {
                setState(() {
                  _sections.add({
                    'type': selectedType,
                    'title': _titleForType(selectedType),
                    'enabled': true,
                    'sortOrder': _sections.length,
                  });
                });
                Navigator.pop(ctx);
              },
              child: Text('Add', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.primary)),
            ),
          ],
        );
      },
    );
  }

  void _toggleSection(int index) {
    setState(() {
      _sections[index]['enabled'] = !(_sections[index]['enabled'] as bool? ?? true);
    });
  }

  void _editSectionTitle(int index) {
    final ctrl = TextEditingController(text: _sections[index]['title'] as String? ?? '');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Edit Section', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        content: TextFormField(controller: ctrl, decoration: const InputDecoration(labelText: 'Title', border: OutlineInputBorder())),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.gray500))),
          TextButton(
            onPressed: () {
              setState(() => _sections[index]['title'] = ctrl.text);
              Navigator.pop(ctx);
            },
            child: Text('Save', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.primary)),
          ),
        ],
      ),
    );
  }

  void _deleteSection(int index) {
    setState(() => _sections.removeAt(index));
  }

  String _titleForType(String type) {
    switch (type) {
      case 'hero': return 'Hero Banner';
      case 'featured': return 'Featured Items';
      case 'categories': return 'Categories';
      case 'testimonials': return 'Testimonials';
      case 'gallery': return 'Photo Gallery';
      case 'cta': return 'Call to Action';
      default: return type;
    }
  }

  IconData _iconForType(String type) {
    switch (type) {
      case 'hero': return Icons.view_carousel;
      case 'featured': return Icons.star;
      case 'categories': return Icons.category;
      case 'testimonials': return Icons.rate_review;
      case 'gallery': return Icons.photo_library;
      case 'cta': return Icons.smart_button;
      default: return Icons.widgets;
    }
  }

  @override
  Widget build(BuildContext context) {
    final cms = ref.watch(cmsProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text('Home Page Sections', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          TextButton.icon(
            onPressed: cms.loading ? null : _saveOrder,
            icon: const Icon(Icons.save, color: Colors.white, size: 18),
            label: Text('Save Order', style: GoogleFonts.inter(color: Colors.white, fontSize: 13)),
          ),
        ],
      ),
      body: _sections.isEmpty
          ? Center(
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(Icons.dashboard_customize, size: 64, color: AppColors.gray300),
                const SizedBox(height: 12),
                Text('No sections yet', style: GoogleFonts.inter(fontSize: 16, color: AppColors.gray500)),
                const SizedBox(height: 4),
                Text('Tap + to add a section', style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray400)),
              ]),
            )
          : ReorderableListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: _sections.length,
              onReorderItem: (oldIndex, newIndex) {
                setState(() {
                  if (newIndex > oldIndex) newIndex--;
                  final item = _sections.removeAt(oldIndex);
                  _sections.insert(newIndex, item);
                });
              },
              itemBuilder: (ctx, i) {
                final s = _sections[i];
                final type = s['type'] as String? ?? '';
                final title = s['title'] as String? ?? _titleForType(type);
                final enabled = s['enabled'] as bool? ?? true;
                return Card(
                  key: ValueKey('section_$i'),
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: Row(mainAxisSize: MainAxisSize.min, children: [
                      ReorderableDragStartListener(
                        index: i,
                        child: const Icon(Icons.drag_handle, color: AppColors.gray400),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                        child: Icon(_iconForType(type), size: 20, color: AppColors.primary),
                      ),
                    ]),
                    title: Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                    subtitle: Text(type, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                    trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                      Switch(
                        value: enabled,
                        onChanged: (_) => _toggleSection(i),
                        activeTrackColor: AppColors.primary,
                      ),
                      IconButton(
                        icon: const Icon(Icons.edit_outlined, size: 18),
                        onPressed: () => _editSectionTitle(i),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.danger),
                        onPressed: () => _deleteSection(i),
                      ),
                    ]),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _addSection,
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add),
      ),
    );
  }
}
