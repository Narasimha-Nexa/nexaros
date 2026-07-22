import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardFilterDto {
  @ApiPropertyOptional({ description: 'Branch ID to scope the dashboard' })
  @IsString()
  @IsOptional()
  branchId?: string;
}
