import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminCopilotChatDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conversationId?: string;
}

export class AdminCopilotReportDto {
  @ApiProperty({ enum: ['daily', 'weekly', 'monthly', 'quarterly', 'branch', 'menu', 'staff'] })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  to?: string;
}
