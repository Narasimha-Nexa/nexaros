import { IsArray, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BatchUpdateTableStatusDto {
  @ApiProperty({ description: 'Array of table IDs to update', type: [String] })
  @IsArray()
  @IsString({ each: true })
  tableIds: string[];

  @ApiProperty({ enum: ['FREE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'ORDER_READY', 'BILLING'] })
  @IsIn(['FREE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'ORDER_READY', 'BILLING'])
  status: string;
}
