import { IsString, IsEnum, IsOptional, IsDateString, IsObject, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCampaignDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['PROMOTIONAL', 'SEASONAL', 'FESTIVAL', 'REENGAGEMENT', 'BIRTHDAY', 'ANNIVERSARY', 'FEEDBACK', 'OTHER'] })
  @IsEnum(['PROMOTIONAL', 'SEASONAL', 'FESTIVAL', 'REENGAGEMENT', 'BIRTHDAY', 'ANNIVERSARY', 'FEEDBACK', 'OTHER'])
  type: string;

  @ApiProperty({ enum: ['EMAIL', 'SMS', 'BOTH'] })
  @IsEnum(['EMAIL', 'SMS', 'BOTH'])
  channel: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  scheduleAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  audienceIds?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  audienceFilter?: Record<string, any>;
}
