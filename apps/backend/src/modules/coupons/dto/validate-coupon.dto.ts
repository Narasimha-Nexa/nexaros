import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateCouponDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  tenantId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  planSlug?: string;
}
