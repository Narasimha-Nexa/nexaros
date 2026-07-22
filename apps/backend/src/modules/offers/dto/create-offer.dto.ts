import { IsString, IsEnum, IsOptional, IsDateString, IsBoolean, IsInt, IsUrl, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';

export class CreateOfferDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  image?: string;

  @ApiProperty({ enum: ['PERCENTAGE', 'FLAT', 'BOGO', 'FREE_DELIVERY'], default: 'PERCENTAGE' })
  @IsEnum(['PERCENTAGE', 'FLAT', 'BOGO', 'FREE_DELIVERY'])
  discountType: 'PERCENTAGE' | 'FLAT' | 'BOGO' | 'FREE_DELIVERY';

  @ApiProperty({ type: Number, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  discountValue?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  couponCode?: string;

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

export class UpdateOfferDto extends PartialType(CreateOfferDto) {}
