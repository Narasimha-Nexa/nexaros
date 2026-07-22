import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../data/support_models.dart';
import '../data/support_service.dart';

class SupportState {
  final List<SupportTicket> tickets;
  final bool isLoading;
  final SupportStats? stats;
  final SupportTicket? selectedTicket;
  final String? error;

  const SupportState({this.tickets = const [], this.isLoading = false, this.stats, this.selectedTicket, this.error});

  SupportState copyWith({List<SupportTicket>? tickets, bool? isLoading, SupportStats? stats, SupportTicket? selectedTicket, String? error, bool clearSelected = false}) {
    return SupportState(
      tickets: tickets ?? this.tickets,
      isLoading: isLoading ?? this.isLoading,
      stats: stats ?? this.stats,
      selectedTicket: clearSelected ? null : (selectedTicket ?? this.selectedTicket),
      error: error,
    );
  }
}

class SupportProvider extends ChangeNotifier {
  final SupportService _service;
  SupportState _state = const SupportState();
  SupportState get state => _state;

  SupportProvider(ApiClient api) : _service = SupportService(api);

  Future<void> loadTickets({String? status, String? priority}) async {
    _state = _state.copyWith(isLoading: true);
    notifyListeners();
    try {
      final tickets = await _service.getTickets(status: status, priority: priority);
      _state = _state.copyWith(tickets: tickets, isLoading: false);
    } catch (e) {
      _state = _state.copyWith(isLoading: false, error: e.toString());
    }
    notifyListeners();
  }

  Future<void> loadStats() async {
    try {
      final stats = await _service.getStats();
      _state = _state.copyWith(stats: stats);
      notifyListeners();
    } catch (_) {}
  }

  Future<void> loadTicket(String id) async {
    _state = _state.copyWith(isLoading: true);
    notifyListeners();
    try {
      final ticket = await _service.getTicket(id);
      _state = _state.copyWith(selectedTicket: ticket, isLoading: false);
    } catch (e) {
      _state = _state.copyWith(isLoading: false, error: e.toString());
    }
    notifyListeners();
  }

  Future<bool> createTicket({required String subject, required String description, String? priority}) async {
    try {
      await _service.createTicket(subject: subject, description: description, priority: priority);
      await loadTickets();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> addMessage(String ticketId, {required String message, bool isInternal = false}) async {
    try {
      await _service.addMessage(ticketId, message: message, isInternal: isInternal);
      await loadTicket(ticketId);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> updateStatus(String ticketId, String status) async {
    try {
      await _service.updateTicketStatus(ticketId, status);
      await loadTicket(ticketId);
      await loadTickets();
      return true;
    } catch (_) {
      return false;
    }
  }

  void clearSelected() {
    _state = _state.copyWith(clearSelected: true);
    notifyListeners();
  }
}
