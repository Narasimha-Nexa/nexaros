import { IsString, IsOptional, IsObject, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAudienceDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsObject()
  criteria: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  customerCount?: number;
}
