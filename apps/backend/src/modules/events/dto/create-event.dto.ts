import { IsString, IsOptional, IsBoolean, IsDateString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;

  @ApiProperty({ required: false, default: 'UPCOMING' })
  @IsOptional()
  @IsString()
  @IsIn(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'])
  status?: string;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}
