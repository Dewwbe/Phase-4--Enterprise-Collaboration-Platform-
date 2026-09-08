import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'EFutures Private Limited' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiProperty({
    example: 'efutures-private-limited',
    description:
      'URL-safe unique identifier. Lowercase letters, numbers and hyphens only.',
  })
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with single hyphens between words.',
  })
  @MinLength(2)
  @MaxLength(60)
  slug: string;
}
