/// Enterprise file system service for upload, download, preview.
library;

import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

/// File type classification.
enum FileType { image, document, spreadsheet, pdf, video, audio, other }

class FileService {
  static final FileService _instance = FileService._();
  factory FileService() => _instance;
  FileService._();

  Future<Directory> get documentsDir async {
    final dir = await getApplicationDocumentsDirectory();
    final filesDir = Directory('${dir.path}/files');
    if (!await filesDir.exists()) await filesDir.create(recursive: true);
    return filesDir;
  }

  Future<Directory> get cacheDir async {
    final dir = await getTemporaryDirectory();
    final cacheDir = Directory('${dir.path}/file_cache');
    if (!await cacheDir.exists()) await cacheDir.create(recursive: true);
    return cacheDir;
  }

  Future<File> downloadFile(
    String url, {
    String? fileName,
    Function(double)? onProgress,
  }) async {
    final dir = await documentsDir;
    final name = fileName ?? p.basename(Uri.parse(url).path);
    final file = File('${dir.path}/$name');

    final request = http.Request('GET', Uri.parse(url));
    final response = await http.Client().send(request);

    final contentLength = response.contentLength ?? 0;
    int receivedBytes = 0;

    final sink = file.openWrite();
    await for (final chunk in response.stream) {
      sink.add(chunk);
      receivedBytes += chunk.length;
      if (contentLength > 0 && onProgress != null) {
        onProgress(receivedBytes / contentLength);
      }
    }
    await sink.close();

    return file;
  }

  Future<http.Response> uploadFile(
    String url,
    File file, {
    String fieldName = 'file',
    Map<String, String>? headers,
  }) async {
    final request = http.MultipartRequest('POST', Uri.parse(url));
    if (headers != null) request.headers.addAll(headers);

    request.files.add(await http.MultipartFile.fromPath(fieldName, file.path));
    final streamedResponse = await request.send();
    return await http.Response.fromStream(streamedResponse);
  }

  static FileType getFileType(String filePath) {
    final ext = p.extension(filePath).toLowerCase();
    switch (ext) {
      case '.jpg' || '.jpeg' || '.png' || '.gif' || '.webp' || '.svg':
        return FileType.image;
      case '.pdf':
        return FileType.pdf;
      case '.doc' || '.docx' || '.txt' || '.rtf':
        return FileType.document;
      case '.xls' || '.xlsx' || '.csv':
        return FileType.spreadsheet;
      case '.mp4' || '.mov' || '.avi':
        return FileType.video;
      case '.mp3' || '.wav' || '.ogg':
        return FileType.audio;
      default:
        return FileType.other;
    }
  }

  static String formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) {
      return '${(bytes / 1024).toStringAsFixed(1)} KB';
    }
    if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  Future<void> deleteCached(String fileName) async {
    final dir = await cacheDir;
    final file = File('${dir.path}/$fileName');
    if (await file.exists()) await file.delete();
  }

  Future<void> clearCache() async {
    final dir = await cacheDir;
    if (await dir.exists()) {
      await dir.delete(recursive: true);
      await dir.create(recursive: true);
    }
  }
}
