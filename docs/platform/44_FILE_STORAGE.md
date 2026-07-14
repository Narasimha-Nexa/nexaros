# File Storage

## Overview

NexaROS stores files locally and in cloud (planned).

## File Types

| Type | Usage | Location |
|------|-------|----------|
| Images | Menu items, logos | Local/Cloud |
| Documents | Invoices, reports | Local/Cloud |
| Exports | CSV, PDF | Local/Cloud |
| Backups | Database, files | Local/Cloud |

## Backend Storage

### Local Storage

```typescript
// storage.service.ts
@Injectable()
export class StorageService {
  private uploadDir = './uploads';
  
  async saveFile(file: Express.Multer.File, path: string) {
    const filePath = `${this.uploadDir}/${path}/${file.originalname}`;
    await fs.writeFile(filePath, file.buffer);
    return filePath;
  }
  
  async getFile(path: string) {
    const filePath = `${this.uploadDir}/${path}`;
    return fs.readFile(filePath);
  }
  
  async deleteFile(path: string) {
    const filePath = `${this.uploadDir}/${path}`;
    await fs.unlink(filePath);
  }
}
```

### Cloud Storage (Planned)

```typescript
// aws-s3.service.ts
@Injectable()
export class AwsS3Service {
  async uploadFile(file: Express.Multer.File, key: string) {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
    
    return this.s3.upload(params).promise();
  }
  
  async getFileUrl(key: string) {
    return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`;
  }
}
```

## Flutter Storage

### Local Storage

```dart
// storage_service.dart
class StorageService {
  Future<void> saveFile(String path, List<int> bytes) async {
    final directory = await getApplicationDocumentsDirectory();
    final file = File('${directory.path}/$path');
    await file.writeAsBytes(bytes);
  }
  
  Future<List<int>> readFile(String path) async {
    final directory = await getApplicationDocumentsDirectory();
    final file = File('${directory.path}/$path');
    return file.readAsBytes();
  }
}
```

## File Upload

```typescript
// upload.controller.ts
@Controller('upload')
export class UploadController {
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const path = `images/${Date.now()}_${file.originalname}`;
    await this.storageService.saveFile(file, path);
    return { url: `/files/${path}` };
  }
}
```

## Related Documents

- [Media Management](45_MEDIA_MANAGEMENT.md)
- [Backend](31_BACKEND_APP.md)
