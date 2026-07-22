import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/staff_models.dart';

class EmployeeManagementScreen extends ConsumerStatefulWidget {
  const EmployeeManagementScreen({super.key});
  @override
  ConsumerState<EmployeeManagementScreen> createState() => _EmployeeManagementScreenState();
}

class _EmployeeManagementScreenState extends ConsumerState<EmployeeManagementScreen> {
  String _search = '';
  EmployeeStatus? _statusFilter;
  String? _departmentFilter;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final branchId = ref.read(appStateProvider).branchId ?? '';
      if (branchId.isNotEmpty) ref.read(staffProvider).loadEmployees(branchId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final staffProv = ref.watch(staffProvider);
    final employees = staffProv.state.filteredEmployees
        .where((e) {
          if (_search.isNotEmpty) {
            final q = _search.toLowerCase();
            return e.fullName.toLowerCase().contains(q) || e.employeeId.toLowerCase().contains(q) || e.phone.contains(q);
          }
          if (_statusFilter != null && e.status != _statusFilter) return false;
          if (_departmentFilter != null && e.departmentName != _departmentFilter) return false;
          return true;
        }).toList();

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('Employee Management'),
        actions: [
          IconButton(icon: const Icon(Icons.person_add), onPressed: () => _showEmployeeDialog(null)),
        ],
      ),
      body: Column(
        children: [
          _buildSearchBar(context),
          _buildFilterChips(context),
          Expanded(
            child: staffProv.state.isLoading
                ? const NxFullScreenLoader(message: 'Loading employees...')
                : employees.isEmpty
                    ? const NxEmptyState(icon: Icons.people_outline, title: 'No Employees', subtitle: 'Add your first employee')
                    : _buildEmployeeList(context, employees),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showEmployeeDialog(null),
        icon: const Icon(Icons.person_add),
        label: const Text('Add Employee'),
      ),
    );
  }

  Widget _buildSearchBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: TextField(
        onChanged: (v) => setState(() => _search = v),
        decoration: InputDecoration(
          hintText: 'Search by name, ID, phone...',
          prefixIcon: const Icon(Icons.search),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          filled: true,
          fillColor: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.3),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
    );
  }

  Widget _buildFilterChips(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Row(
        children: [
          _chip('All', _statusFilter == null, () => setState(() { _statusFilter = null; _departmentFilter = null; })),
          const SizedBox(width: 8),
          _chip('Active', _statusFilter == EmployeeStatus.active, () => setState(() => _statusFilter = EmployeeStatus.active)),
          const SizedBox(width: 8),
          _chip('On Leave', _statusFilter == EmployeeStatus.onLeave, () => setState(() => _statusFilter = EmployeeStatus.onLeave)),
          const SizedBox(width: 8),
          _chip('Probation', _statusFilter == EmployeeStatus.probation, () => setState(() => _statusFilter = EmployeeStatus.probation)),
          const SizedBox(width: 8),
          _chip('Inactive', _statusFilter == EmployeeStatus.inactive, () => setState(() => _statusFilter = EmployeeStatus.inactive)),
        ],
      ),
    );
  }

  Widget _chip(String label, bool selected, VoidCallback onTap) {
    return FilterChip(
      label: Text(label, style: TextStyle(fontSize: 12, color: selected ? Colors.white : AppColors.gray700)),
      selected: selected,
      onSelected: (_) => onTap(),
      selectedColor: AppColors.primary,
      backgroundColor: AppColors.gray100,
      checkmarkColor: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 4),
    );
  }

  Widget _buildEmployeeList(BuildContext context, List<Employee> employees) {
    if (ResponsiveLayout.isDesktop(context)) {
      return _buildDataTable(context, employees);
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: employees.length,
      itemBuilder: (context, i) => _buildEmployeeCard(context, employees[i]),
    );
  }

  Widget _buildDataTable(BuildContext context, List<Employee> employees) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: NxCard(
        child: DataTable(
          columns: const [
            DataColumn(label: Text('Employee')),
            DataColumn(label: Text('ID')),
            DataColumn(label: Text('Department')),
            DataColumn(label: Text('Role')),
            DataColumn(label: Text('Status')),
            DataColumn(label: Text('Actions')),
          ],
          rows: employees.map((e) => DataRow(cells: [
            DataCell(Row(children: [NxAvatar(name: e.fullName, size: 32), const SizedBox(width: 8), Text(e.fullName)])),
            DataCell(Text(e.employeeId, style: const TextStyle(fontSize: 12))),
            DataCell(Text(e.departmentName)),
            DataCell(Text(e.roleName)),
            DataCell(_statusBadge(e.status)),
            DataCell(Row(children: [
              IconButton(icon: const Icon(Icons.edit, size: 18), onPressed: () => _showEmployeeDialog(e)),
              IconButton(icon: const Icon(Icons.delete, size: 18, color: AppColors.danger), onPressed: () => _confirmDelete(e)),
            ])),
          ])).toList(),
        ),
      ),
    );
  }

  Widget _buildEmployeeCard(BuildContext context, Employee e) {
    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () => _showEmployeeDetail(e),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              NxAvatar(name: e.fullName, size: 48),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Text(e.fullName, style: const TextStyle(fontWeight: FontWeight.w600)),
                      const SizedBox(width: 8),
                      _statusBadge(e.status),
                    ]),
                    const SizedBox(height: 4),
                    Text('${e.roleName} • ${e.departmentName}', style: const TextStyle(fontSize: 12, color: AppColors.gray600)),
                    Text(e.phone, style: const TextStyle(fontSize: 12, color: AppColors.gray500)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.gray400),
            ],
          ),
        ),
      ),
    );
  }

  Widget _statusBadge(EmployeeStatus status) {
    final color = StatusHelpers.employeeStatusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
      child: Text(StatusHelpers.employeeStatusLabel(status), style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
    );
  }

  void _showEmployeeDialog(Employee? existing) {
    final nameCtrl = TextEditingController(text: existing?.firstName ?? '');
    final lastNameCtrl = TextEditingController(text: existing?.lastName ?? '');
    final emailCtrl = TextEditingController(text: existing?.email ?? '');
    final phoneCtrl = TextEditingController(text: existing?.phone ?? '');
    final deptCtrl = TextEditingController(text: existing?.departmentName ?? '');
    final roleCtrl = TextEditingController(text: existing?.roleName ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(existing != null ? 'Edit Employee' : 'Add Employee'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'First Name *')),
              const SizedBox(height: 12),
              TextField(controller: lastNameCtrl, decoration: const InputDecoration(labelText: 'Last Name *')),
              const SizedBox(height: 12),
              TextField(controller: emailCtrl, decoration: const InputDecoration(labelText: 'Email'), keyboardType: TextInputType.emailAddress),
              const SizedBox(height: 12),
              TextField(controller: phoneCtrl, decoration: const InputDecoration(labelText: 'Phone *'), keyboardType: TextInputType.phone),
              const SizedBox(height: 12),
              TextField(controller: deptCtrl, decoration: const InputDecoration(labelText: 'Department')),
              const SizedBox(height: 12),
              TextField(controller: roleCtrl, decoration: const InputDecoration(labelText: 'Role')),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final data = {
                'firstName': nameCtrl.text,
                'lastName': lastNameCtrl.text,
                'email': emailCtrl.text,
                'phone': phoneCtrl.text,
                'departmentName': deptCtrl.text,
                'roleName': roleCtrl.text,
              };
              final branchId = ref.read(appStateProvider).branchId ?? '';
              if (existing != null) {
                await ref.read(staffProvider).updateEmployee(existing.id, data);
              } else {
                await ref.read(staffProvider).createEmployee(branchId, data);
              }
              if (ctx.mounted) Navigator.pop(ctx);
            },
            child: Text(existing != null ? 'Update' : 'Create'),
          ),
        ],
      ),
    );
  }

  void _showEmployeeDetail(Employee e) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.95,
        expand: false,
        builder: (ctx, scrollCtrl) => SingleChildScrollView(
          controller: scrollCtrl,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(child: NxAvatar(name: e.fullName, size: 80)),
              const SizedBox(height: 12),
              Center(child: Text(e.fullName, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold))),
              Center(child: Text(e.employeeId, style: const TextStyle(color: AppColors.gray600))),
              const SizedBox(height: 20),
              _detailRow('Email', e.email),
              _detailRow('Phone', e.phone),
              _detailRow('Department', e.departmentName),
              _detailRow('Role', e.roleName),
              _detailRow('Branch', e.branchName),
              _detailRow('Type', e.employmentType.name),
              _detailRow('Status', StatusHelpers.employeeStatusLabel(e.status)),
              if (e.dateOfJoining != null) _detailRow('Joined', '${e.dateOfJoining!.day}/${e.dateOfJoining!.month}/${e.dateOfJoining!.year}'),
              if (e.managerName != null) _detailRow('Manager', e.managerName!),
              if (e.emergencyContactName != null) ...[
                const Divider(height: 24),
                Text('Emergency Contact', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
                _detailRow('Name', e.emergencyContactName!),
                if (e.emergencyContactPhone != null) _detailRow('Phone', e.emergencyContactPhone!),
              ],
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(child: OutlinedButton.icon(onPressed: () { Navigator.pop(ctx); _showEmployeeDialog(e); }, icon: const Icon(Icons.edit), label: const Text('Edit'))),
                  const SizedBox(width: 12),
                  Expanded(child: OutlinedButton.icon(onPressed: () { Navigator.pop(ctx); _confirmDelete(e); }, icon: const Icon(Icons.delete, color: AppColors.danger), label: const Text('Delete', style: TextStyle(color: AppColors.danger)))),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          SizedBox(width: 100, child: Text(label, style: const TextStyle(color: AppColors.gray600, fontSize: 13))),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13))),
        ],
      ),
    );
  }

  void _confirmDelete(Employee e) async {
    final confirmed = await NxConfirmationDialog.show(
      context: context,
      title: 'Delete Employee',
      message: 'Are you sure you want to delete ${e.fullName}? This action cannot be undone.',
      confirmLabel: 'Delete',
    );
    if (confirmed == true && context.mounted) {
      await ref.read(staffProvider).deleteEmployee(e.id);
    }
  }
}
