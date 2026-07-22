import { IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyCouponDto {
  @ApiProperty()
  @IsString()
  couponCode: string;

  @ApiProperty()
  @IsString()
  tenantId: string;

  @ApiProperty()
  @IsString()
  subscriptionId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;
}
