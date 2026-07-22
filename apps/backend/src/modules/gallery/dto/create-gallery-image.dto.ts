import { IsString, IsOptional, IsBoolean, IsInt, IsUrl, Min, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';

export class CreateGalleryImageDto {
  @ApiProperty()
  @IsUrl()
  imageUrl: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiProperty({ required: false, type: Number, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  imageMetadata?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  branchId?: string;
}

export class UpdateGalleryImageDto extends PartialType(CreateGalleryImageDto) {}
