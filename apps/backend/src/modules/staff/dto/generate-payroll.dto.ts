import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GeneratePayrollDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty()
  @IsInt()
  @Min(2020)
  year: number;
}
