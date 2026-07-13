import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SuggestPairingsDto {
  @ApiProperty({ description: 'Menu item ID to find pairings for' })
  @IsString()
  menuItemId!: string;
}

export class ForecastDemandDto {
  @ApiProperty({ description: 'Number of days to forecast', required: false, default: 7 })
  @IsOptional()
  @IsInt()
  @Min(1)
  days?: number;
}
