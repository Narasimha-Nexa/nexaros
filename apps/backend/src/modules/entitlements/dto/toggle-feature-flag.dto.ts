import { IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleFeatureFlagDto {
  @ApiProperty()
  @IsString()
  key: string;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;
}
