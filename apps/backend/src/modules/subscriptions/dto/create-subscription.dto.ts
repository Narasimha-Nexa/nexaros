import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsString()
  planId!: string;
}

export class UpdateSubscriptionDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  planId?: string;

  @ApiProperty({
    enum: ['TRIAL', 'ACTIVE', 'PAYMENT_PENDING', 'GRACE_PERIOD', 'RESTRICTED', 'SUSPENDED', 'ARCHIVED'],
    required: false,
  })
  @IsEnum(['TRIAL', 'ACTIVE', 'PAYMENT_PENDING', 'GRACE_PERIOD', 'RESTRICTED', 'SUSPENDED', 'ARCHIVED'])
  @IsOptional()
  status?: string;
}
