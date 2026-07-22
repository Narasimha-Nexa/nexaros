import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JoinDiningSessionDto {
  @ApiProperty() @IsString() guestToken: string;
  @ApiPropertyOptional() @IsOptional() @IsString() guestName?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) guestNumber?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() avatarColor?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() deviceFingerprint?: string;
}
