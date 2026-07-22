import { IsString, IsEnum, IsDateString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLeaveRequestDto {
  @ApiProperty({ enum: ['SICK', 'CASUAL', 'ANNUAL', 'UNPAID', 'OTHER'] })
  @IsEnum(['SICK', 'CASUAL', 'ANNUAL', 'UNPAID', 'OTHER'])
  type: 'SICK' | 'CASUAL' | 'ANNUAL' | 'UNPAID' | 'OTHER';

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiProperty()
  @IsString()
  reason: string;
}
