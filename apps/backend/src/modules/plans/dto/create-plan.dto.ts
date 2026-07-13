import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({ example: 'Basic Plan' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 2999 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ enum: ['MONTHLY', 'YEARLY', 'LIFETIME'], default: 'MONTHLY' })
  @IsEnum(['MONTHLY', 'YEARLY', 'LIFETIME'])
  billingCycle?: 'MONTHLY' | 'YEARLY' | 'LIFETIME' = 'MONTHLY';

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  maxBranches?: number = 1;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(1)
  maxStaff?: number = 10;

  @ApiProperty({ example: ['menu_management', 'order_management'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
