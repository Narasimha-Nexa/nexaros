import { IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetTenantFeatureFlagDto {
  @ApiProperty()
  @IsString()
  tenantId: string;

  @ApiProperty()
  @IsString()
  featureFlagKey: string;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}
