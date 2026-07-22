import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService } from '../../modules/api-keys/api-keys.service';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('Missing API key');
    }

    const crypto = require('crypto');
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const result = await this.apiKeysService.validate(keyHash);

    if (!result) {
      throw new UnauthorizedException('Invalid or expired API key');
    }

    request.user = {
      tenantId: result.tenantId,
      permissions: result.permissions,
    };

    return true;
  }
}
