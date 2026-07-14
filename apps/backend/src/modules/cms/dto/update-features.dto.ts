import { IsObject, IsOptional } from 'class-validator';

export class UpdateFeaturesDto {
  @IsObject()
  features: Record<string, any>;
}
