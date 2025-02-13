import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Ensure MongooseModule is imported
import { User, UserSchema } from './users.schema'; // Import User schema
import { UsersService } from './users.service'; // Import UserService
import { UsersController } from './users.controller';
import { Role, RoleSchema } from 'src/roles/roles.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]),
  ],
  providers: [UsersService], // Register the UserService
  exports: [UsersService], // Export UserService if needed in other modules
  controllers: [UsersController],
})
export class UsersModule {}
