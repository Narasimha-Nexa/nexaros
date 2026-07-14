import { IsArray, IsOptional } from 'class-validator';

export class UpdateSectionsDto {
  @IsArray()
  sections: any[];
}
