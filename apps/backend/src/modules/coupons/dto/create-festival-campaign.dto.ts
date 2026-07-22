import { IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFestivalCampaignDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  discountPercent: number;

  @ApiProperty()
  @IsString()
  expiry: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  maxUses: number;
}
