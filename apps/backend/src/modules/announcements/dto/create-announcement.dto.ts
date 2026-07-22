import { IsString, IsEnum, IsOptional, IsDateString, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';

export class CreateAnnouncementDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty({ enum: ['INFO', 'PROMO', 'EVENT', 'ALERT', 'MAINTENANCE', 'HOLIDAY'], default: 'INFO' })
  @IsEnum(['INFO', 'PROMO', 'EVENT', 'ALERT', 'MAINTENANCE', 'HOLIDAY'])
  type: 'INFO' | 'PROMO' | 'EVENT' | 'ALERT' | 'MAINTENANCE' | 'HOLIDAY';

  @ApiProperty({ required: false, type: Number, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, type: Number, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  branchId?: string;
}

export class UpdateAnnouncementDto extends PartialType(CreateAnnouncementDto) {}
