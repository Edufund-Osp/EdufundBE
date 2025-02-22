import { IsEnum, IsNotEmpty } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsEnum(['admin', 'organization', 'donor'], { message: 'Role must be admin, organization, or donor' })
  name: 'admin' | 'organization' | 'donor';
}
