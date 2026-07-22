import { IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetCustomEntitlementsDto {
  @ApiProperty()
  @IsString()
  tenantId: string;

  @ApiProperty()
  @IsObject()
  entitlements: Record<string, boolean>;
}
