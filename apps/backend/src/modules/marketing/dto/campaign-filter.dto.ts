import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CampaignFilterDto {
  @ApiProperty({ required: false, enum: ['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED', 'ARCHIVED'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED', 'ARCHIVED'])
  status?: string;

  @ApiProperty({ required: false, enum: ['PROMOTIONAL', 'SEASONAL', 'FESTIVAL', 'REENGAGEMENT', 'BIRTHDAY', 'ANNIVERSARY', 'FEEDBACK', 'OTHER'] })
  @IsOptional()
  @IsEnum(['PROMOTIONAL', 'SEASONAL', 'FESTIVAL', 'REENGAGEMENT', 'BIRTHDAY', 'ANNIVERSARY', 'FEEDBACK', 'OTHER'])
  type?: string;
}
