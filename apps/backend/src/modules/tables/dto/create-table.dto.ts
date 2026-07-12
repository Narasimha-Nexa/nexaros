import { IsInt, IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTableDto {
  @ApiProperty()
  @IsInt()
  number: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ default: 4 })
  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;
}
