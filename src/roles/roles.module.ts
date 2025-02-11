import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Ensure MongooseModule is imported
import { Role, RoleSchema } from './roles.schema'; // Import Role schema
import { RolesService } from './roles.service'; // Import RolesService
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]), // Register Role model
  ],
  providers: [RolesService], // Register the RolesService
  exports: [RolesService], // Export RolesService if needed in other modules
})
export class RolesModule {}
