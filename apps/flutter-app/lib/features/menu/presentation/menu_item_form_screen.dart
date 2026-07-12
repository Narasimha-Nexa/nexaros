import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/menu_provider.dart';

class MenuItemFormScreen extends StatefulWidget {
  final MenuProvider menuProvider;
  final MenuItem? item;

  const MenuItemFormScreen({super.key, required this.menuProvider, this.item});

  @override
  State<MenuItemFormScreen> createState() => _MenuItemFormScreenState();
}

class _MenuItemFormScreenState extends State<MenuItemFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _priceController = TextEditingController();
  final _descController = TextEditingController();
  bool _isVeg = true;
  bool _isAvailable = true;
  bool _isSaving = false;
  String? _selectedCategoryId;
  final List<File> _newImages = [];
  final _picker = ImagePicker();

  bool get _isEditing => widget.item != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _nameController.text = widget.item!.name;
      _priceController.text = widget.item!.price.toString();
      _descController.text = widget.item!.description ?? '';
      _isVeg = widget.item!.isVeg;
      _isAvailable = widget.item!.isAvailable;
      _selectedCategoryId = widget.item!.categoryId;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _priceController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    final images = await _picker.pickMultiImage(imageQuality: 80);
    if (images.isNotEmpty) {
      setState(() => _newImages.addAll(images.map((x) => File(x.path))));
    }
  }

  Future<void> _takePicture() async {
    final image = await _picker.pickImage(source: ImageSource.camera, imageQuality: 80);
    if (image != null) {
      setState(() => _newImages.add(File(image.path)));
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCategoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a category')));
      return;
    }

    setState(() => _isSaving = true);

    try {
      final data = {
        'name': _nameController.text.trim(),
        'price': double.parse(_priceController.text.trim()),
        'description': _descController.text.trim().isEmpty ? null : _descController.text.trim(),
        'isVeg': _isVeg,
        'isAvailable': _isAvailable,
        'categoryId': _selectedCategoryId,
      };

      if (_isEditing) {
        await widget.menuProvider.updateItem(widget.item!.id, data);
        if (_newImages.isNotEmpty) {
          await widget.menuProvider.uploadImages(widget.item!.id, _newImages.map((f) => f.path).toList());
        }
      } else {
        await widget.menuProvider.createItem(data);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_isEditing ? 'Item updated' : 'Item created'), backgroundColor: Colors.green),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }

    if (mounted) setState(() => _isSaving = false);
  }

  @override
  Widget build(BuildContext context) {
    final categories = widget.menuProvider.categories;

    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Item' : 'Add Item', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          TextButton(
            onPressed: _isSaving ? null : _save,
            child: _isSaving
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Save', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Images section
            Text('Photos', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            SizedBox(
              height: 100,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  // Existing images
                  if (_isEditing)
                    ...widget.item!.images.map((img) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: CachedNetworkImage(
                              imageUrl: img['url'].startsWith('http') ? img['url'] : 'http://localhost:4000${img['url']}',
                              width: 100,
                              height: 100,
                              fit: BoxFit.cover,
                            ),
                          ),
                          if (img['isPrimary'] == true)
                            Positioned(
                              top: 4,
                              left: 4,
                              child: Container(
                                padding: const EdgeInsets.all(2),
                                decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(4)),
                                child: const Icon(Icons.star, size: 12, color: Colors.white),
                              ),
                            ),
                        ],
                      ),
                    )),
                  // New images
                  ..._newImages.map((file) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.file(file, width: 100, height: 100, fit: BoxFit.cover),
                    ),
                  )),
                  // Add button
                  GestureDetector(
                    onTap: _showImageSourceDialog,
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.gray300),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_photo_alternate, color: AppColors.gray400, size: 28),
                          const SizedBox(height: 4),
                          Text('Add', style: TextStyle(fontSize: 11, color: AppColors.gray400)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Category
            DropdownButtonFormField<String>(
              initialValue: _selectedCategoryId,
              decoration: const InputDecoration(labelText: 'Category', border: OutlineInputBorder()),
              items: categories.map((c) => DropdownMenuItem(value: c['id'] as String, child: Text(c['name'] as String))).toList(),
              onChanged: (v) => setState(() => _selectedCategoryId = v),
              validator: (v) => v == null ? 'Select a category' : null,
            ),
            const SizedBox(height: 16),

            // Name
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Item Name', border: OutlineInputBorder()),
              validator: (v) => v == null || v.trim().isEmpty ? 'Name is required' : null,
            ),
            const SizedBox(height: 16),

            // Price
            TextFormField(
              controller: _priceController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Price (₹)', border: OutlineInputBorder(), prefixText: '₹ '),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Price is required';
                if (double.tryParse(v.trim()) == null) return 'Enter a valid number';
                return null;
              },
            ),
            const SizedBox(height: 16),

            // Description
            TextFormField(
              controller: _descController,
              maxLines: 2,
              decoration: const InputDecoration(labelText: 'Description (optional)', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),

            // Veg / Non-Veg toggle
            Row(
              children: [
                Text('Type:', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                const SizedBox(width: 16),
                ChoiceChip(
                  label: const Text('Veg'),
                  selected: _isVeg,
                  onSelected: (_) => setState(() => _isVeg = true),
                  selectedColor: Colors.green.shade100,
                  avatar: Icon(Icons.circle, size: 10, color: Colors.green),
                ),
                const SizedBox(width: 8),
                ChoiceChip(
                  label: const Text('Non-Veg'),
                  selected: !_isVeg,
                  onSelected: (_) => setState(() => _isVeg = false),
                  selectedColor: Colors.red.shade100,
                  avatar: Icon(Icons.circle, size: 10, color: Colors.red),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Availability toggle
            SwitchListTile(
              title: const Text('Available'),
              subtitle: Text(_isAvailable ? 'Item is on the menu' : 'Item is hidden'),
              value: _isAvailable,
              onChanged: (v) => setState(() => _isAvailable = v),
              contentPadding: EdgeInsets.zero,
            ),
          ],
        ),
      ),
    );
  }

  void _showImageSourceDialog() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Gallery'),
              onTap: () { Navigator.pop(ctx); _pickImages(); },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Camera'),
              onTap: () { Navigator.pop(ctx); _takePicture(); },
            ),
          ],
        ),
      ),
    );
  }
}
