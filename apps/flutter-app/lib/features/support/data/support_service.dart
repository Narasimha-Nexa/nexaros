import '../../../core/network/api_client.dart';
import 'support_models.dart';

class SupportService {
  final ApiClient _api;
  SupportService(this._api);

  Future<List<SupportTicket>> getTickets({String? status, String? priority, int page = 1, int limit = 50}) async {
    final data = await _api.getSupportTickets(status: status, priority: priority, page: page, limit: limit);
    final tickets = data['tickets'] as List<dynamic>? ?? [];
    return tickets.map((json) => SupportTicket.fromJson(json)).toList();
  }

  Future<SupportTicket> getTicket(String id) async {
    final data = await _api.getSupportTicket(id);
    return SupportTicket.fromJson(data);
  }

  Future<SupportTicket> createTicket({required String subject, required String description, String? priority}) async {
    final data = await _api.createSupportTicket(subject: subject, description: description, priority: priority);
    return SupportTicket.fromJson(data);
  }

  Future<TicketMessage> addMessage(String ticketId, {required String message, bool isInternal = false}) async {
    final data = await _api.addSupportMessage(ticketId, message: message, isInternal: isInternal);
    return TicketMessage.fromJson(data);
  }

  Future<SupportTicket> updateTicketStatus(String ticketId, String status, {String? assignedTo}) async {
    final data = await _api.updateSupportTicketStatus(ticketId, status: status, assignedTo: assignedTo);
    return SupportTicket.fromJson(data);
  }

  Future<SupportStats> getStats() async {
    final data = await _api.getSupportStats();
    return SupportStats.fromJson(data);
  }
}
