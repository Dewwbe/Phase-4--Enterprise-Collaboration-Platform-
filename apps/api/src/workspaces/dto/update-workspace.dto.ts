import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateWorkspaceDto } from './create-workspace.dto';

export class UpdateWorkspaceDto extends PartialType(
  OmitType(CreateWorkspaceDto, ['organizationId', 'slug'] as const),
) {}
