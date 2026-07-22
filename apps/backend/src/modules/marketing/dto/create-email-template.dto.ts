import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmailTemplateDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @ApiProperty({ required: false, default: 'marketing' })
  @IsOptional()
  @IsString()
  category?: string;
}
