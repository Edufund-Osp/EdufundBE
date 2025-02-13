import { Controller, Post, Get, Body } from '@nestjs/common';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Post()
  async createRole(@Body() body: { name: string }) {
    return this.rolesService.findOrCreateRole(body.name);
  }

  @Get()
  async getRoles() {
    return this.rolesService.findAll();
  }
}
