import { ApiProperty } from '@nestjs/swagger';

export class SplitTableDto {
  @ApiProperty({ description: 'How many tables to split into' })
  splitCount: number;
}
