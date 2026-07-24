import { IsArray, IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MergeTablesDto {
  @ApiProperty({ description: 'Array of table IDs to merge (minimum 2)', type: [String] })
  @IsArray()
  @IsString({ each: true })
  tableIds: string[];

  @ApiPropertyOptional({ description: 'Name for the merged table' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Combined capacity (auto-calculated if omitted)' })
  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;
}
