import { IsString, IsEnum, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ enum: ['INCOME', 'EXPENSE'] })
  @IsEnum(['INCOME', 'EXPENSE'])
  type: 'INCOME' | 'EXPENSE';

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  category: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  orderId?: string;
}
