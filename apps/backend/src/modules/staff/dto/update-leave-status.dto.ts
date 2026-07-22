import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLeaveStatusDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED', 'CANCELLED'] })
  @IsEnum(['APPROVED', 'REJECTED', 'CANCELLED'])
  status: 'APPROVED' | 'REJECTED' | 'CANCELLED';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
