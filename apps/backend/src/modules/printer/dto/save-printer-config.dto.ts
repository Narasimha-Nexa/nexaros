import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PrinterConfigDto {
  @ApiProperty({ description: 'Printer identifier' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Printer display name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Printer type (NETWORK, USB, BLUETOOTH)' })
  @IsString()
  type!: string;

  @ApiProperty({ description: 'IP address for network printers' })
  @IsString()
  ipAddress!: string;

  @ApiProperty({ description: 'Port number' })
  @IsNumber()
  port!: number;

  @ApiPropertyOptional({ description: 'Whether this is the default printer' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Whether the printer is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Paper size (e.g., 80mm)' })
  @IsOptional()
  @IsString()
  paperSize?: string;
}

export class SavePrinterConfigDto {
  @ApiProperty({ description: 'List of printer configurations', type: [PrinterConfigDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrinterConfigDto)
  printers!: PrinterConfigDto[];
}
