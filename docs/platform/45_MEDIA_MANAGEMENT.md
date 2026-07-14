# Media Management

## Image Types

| Type | Usage | Size |
|------|-------|------|
| Menu Item Images | Item photos | <5MB |
| Restaurant Logo | Brand identity | <2MB |
| Category Images | Category icons | <1MB |
| Staff Photos | Employee profiles | <2MB |

## Image Processing

### Upload

```typescript
// image.service.ts
@Injectable()
export class ImageService {
  async processImage(file: Express.Multer.File) {
    // Resize
    const resized = await sharp(file.buffer)
      .resize(800, 600, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    // Generate thumbnail
    const thumbnail = await sharp(file.buffer)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toBuffer();
    
    return { resized, thumbnail };
  }
}
```

### Storage

```
uploads/
├── images/
│   ├── menu/
│   │   ├── {id}_full.jpg
│   │   └── {id}_thumb.jpg
│   ├── logo/
│   │   └── {tenantId}.jpg
│   └── category/
│       └── {id}.jpg
└── documents/
    ├── invoices/
    └── reports/
```

## Flutter Image Handling

### Pick Image

```dart
// image_picker.dart
class ImagePickerService {
  Future<File?> pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 85,
    );
    
    if (pickedFile != null) {
      return File(pickedFile.path);
    }
    return null;
  }
}
```

### Display Image

```dart
// CachedNetworkImage
CachedNetworkImage(
  imageUrl: 'https://example.com/image.jpg',
  placeholder: (context, url) => CircularProgressIndicator(),
  errorWidget: (context, url, error) => Icon(Icons.error),
  fit: BoxFit.cover,
);
```

## Related Documents

- [File Storage](44_FILE_STORAGE.md)
- [Performance](30_PERFORMANCE.md)
