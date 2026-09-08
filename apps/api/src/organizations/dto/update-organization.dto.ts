import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateOrganizationDto } from './create-organization.dto';

// Slug is immutable after creation to avoid breaking existing workspace URLs.
export class UpdateOrganizationDto extends PartialType(
  OmitType(CreateOrganizationDto, ['slug'] as const),
) {}
