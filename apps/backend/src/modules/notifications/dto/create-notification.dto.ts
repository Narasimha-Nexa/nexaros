import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  message!: string;

  @ApiProperty({ enum: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'], default: 'IN_APP' })
  @IsEnum(['EMAIL', 'SMS', 'PUSH', 'IN_APP'])
  @IsOptional()
  channel?: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  recipientId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  recipientEmail?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  recipientPhone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  entityType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  branchIds?: string[];
}
