import 'dart:async';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/services.dart';

/// Centralized sound service for NexaROS.
///
/// Manages audio playback for kitchen alerts, notifications, and other
/// sound effects. Currently provides a kitchen bell chime for new orders.
class SoundService {
  static const _kitchenChimeAsset = 'sounds/kitchen_chime.wav';

  // Cache the player to avoid recreation overhead on each alert
  final AudioPlayer _player = AudioPlayer();

  bool _muted = false;

  /// Whether sound is muted.
  bool get muted => _muted;

  /// Toggle mute state.
  void toggleMute() {
    _muted = !_muted;
  }

  /// Set mute state explicitly.
  void setMuted(bool value) {
    _muted = value;
  }

  /// Plays the kitchen bell chime when a new order arrives in the KDS.
  ///
  /// Falls back to [SystemSound.click] if audio playback fails.
  /// Does nothing when [muted] is true.
  Future<void> playNewOrderChime() async {
    if (_muted) return;
    try {
      await _player.stop();
      await _player.setSource(AssetSource(_kitchenChimeAsset));
      await _player.setVolume(0.8);
      await _player.resume();
    } catch (_) {
      // Fallback: use system sound if audioplayers fails
      SystemSound.play(SystemSoundType.click);
    }
  }

  /// Release audio resources.
  void dispose() {
    _player.dispose();
  }
}
