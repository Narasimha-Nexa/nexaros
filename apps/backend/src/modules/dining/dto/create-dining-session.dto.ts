import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDiningSessionDto {
  @ApiProperty() @IsString() branchId: string;
  @ApiProperty() @IsString() tableId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() guestName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() guestToken?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) guestCount?: number;
}
