import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_theme.dart';

class ReviewsScreen extends ConsumerStatefulWidget {
  const ReviewsScreen({super.key});
  @override
  ConsumerState<ReviewsScreen> createState() => _ReviewsScreenState();
}

class _ReviewsScreenState extends ConsumerState<ReviewsScreen> {
  int? _filterRating;
  bool? _filterPublished;

  @override
  void initState() { super.initState(); ref.read(crmProvider.notifier).loadReviews(); }

  @override
  Widget build(BuildContext context) {
    final crm = ref.watch(crmProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text('Reviews & Feedback', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.primary, foregroundColor: Colors.white,
        actions: [
          IconButton(icon: const Icon(Icons.filter_list), onPressed: () => _showFilterDialog()),
        ],
      ),
      body: Column(children: [
        // Rating filter chips
        Container(
          height: 48,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: ListView(scrollDirection: Axis.horizontal, children: [
            _filterChip('All', _filterRating == null, () => setState(() { _filterRating = null; crm.loadReviews(); })),
            for (final r in [5, 4, 3, 2, 1])
              _filterChip('$r★', _filterRating == r, () => setState(() { _filterRating = r; crm.loadReviews(rating: r); })),
            const SizedBox(width: 8),
            _filterChip(_filterPublished == true ? 'Published' : 'All', _filterPublished != null, () => setState(() { _filterPublished = _filterPublished == true ? null : true; crm.loadReviews(published: _filterPublished); })),
          ]),
        ),
        const Divider(height: 1),
        Expanded(child: crm.reviewsLoading
            ? const Center(child: CircularProgressIndicator())
            : crm.reviews.isEmpty
                ? Center(child: Text('No reviews yet', style: GoogleFonts.inter(color: AppColors.gray500)))
                : ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: crm.reviews.length,
                    itemBuilder: (ctx, i) {
                      final r = crm.reviews[i];
                      final customer = r['customer'] as Map<String, dynamic>?;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Row(children: [
                              // Stars
                              ...List.generate(5, (si) => Icon(si < (r['rating'] ?? 0) ? Icons.star : Icons.star_border, size: 16, color: Colors.amber)),
                              const Spacer(),
                              if (!(r['isPublished'] ?? true))
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(color: AppColors.gray200, borderRadius: BorderRadius.circular(4)),
                                  child: Text('Hidden', style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray600)),
                                ),
                            ]),
                            const SizedBox(height: 6),
                            if (r['title'] != null) Text(r['title'], style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                            const SizedBox(height: 4),
                            Text(r['comment'] ?? '', style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray700)),
                            const SizedBox(height: 8),
                            Row(children: [
                              if (customer != null) Text(customer['name'] ?? '', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
                              const Spacer(),
                              Text(_timeAgo(r['createdAt'] as String? ?? ''), style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400)),
                            ]),
                            // Reply
                            if (r['reply'] != null) ...[
                              const Divider(),
                              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                const Icon(Icons.reply, size: 14, color: AppColors.primary),
                                const SizedBox(width: 4),
                                Expanded(child: Text(r['reply'], style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray600, fontStyle: FontStyle.italic))),
                              ]),
                            ],
                            // Actions
                            const Divider(height: 8),
                            Row(children: [
                              if (r['reply'] == null)
                                TextButton.icon(
                                  icon: const Icon(Icons.reply, size: 16),
                                  label: const Text('Reply'),
                                  onPressed: () => _showReplyDialog(ctx, r['id']),
                                ),
                              TextButton.icon(
                                icon: Icon(r['isPublished'] == true ? Icons.visibility_off : Icons.visibility, size: 16),
                                label: Text(r['isPublished'] == true ? 'Hide' : 'Show'),
                                onPressed: () => crm.toggleReviewPublish(r['id']),
                              ),
                            ]),
                          ]),
                        ),
                      );
                    },
                  ),
        ),
      ]),
    );
  }

  Widget _filterChip(String label, bool selected, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: FilterChip(
        label: Text(label, style: GoogleFonts.inter(fontSize: 12)),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: AppColors.primary.withValues(alpha: 0.2),
        labelStyle: TextStyle(color: selected ? AppColors.primary : AppColors.gray700, fontWeight: selected ? FontWeight.w600 : FontWeight.normal),
        visualDensity: VisualDensity.compact,
      ),
    );
  }

  void _showFilterDialog() {
    showDialog(context: context, builder: (ctx) => AlertDialog(
      title: const Text('Filter Reviews'),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextButton(onPressed: () { _filterRating = null; _filterPublished = null; ref.read(crmProvider.notifier).loadReviews(); Navigator.pop(ctx); }, child: const Text('Clear Filters')),
      ]),
    ));
  }

  void _showReplyDialog(BuildContext ctx, String reviewId) {
    final ctrl = TextEditingController();
    showDialog(
      context: ctx,
      builder: (dCtx) => AlertDialog(
        title: const Text('Reply to Review'),
        content: TextField(controller: ctrl, maxLines: 3, decoration: const InputDecoration(hintText: 'Write your reply...', border: OutlineInputBorder())),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dCtx), child: const Text('Cancel')),
          TextButton(onPressed: () async {
            if (ctrl.text.trim().isNotEmpty) {
              await ref.read(crmProvider.notifier).replyToReview(reviewId, ctrl.text.trim());
              if (dCtx.mounted) Navigator.pop(dCtx);
            }
          }, child: const Text('Send Reply', style: TextStyle(color: AppColors.primary))),
        ],
      ),
    );
  }

  String _timeAgo(String date) {
    try {
      final dt = DateTime.parse(date);
      final diff = DateTime.now().difference(dt);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      return '${diff.inDays}d ago';
    } catch (_) { return date; }
  }
}
