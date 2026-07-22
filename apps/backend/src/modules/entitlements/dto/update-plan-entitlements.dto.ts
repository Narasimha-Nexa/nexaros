import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePlanEntitlementsDto {
  @ApiProperty()
  @IsObject()
  entitlements: Record<string, boolean>;
}
