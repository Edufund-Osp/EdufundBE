import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Ensure MongooseModule is imported
import { User, UserSchema } from './users.schema'; // Import User schema
import { UsersService } from './users.service'; // Import UserService

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), // Register User model
  ],
  providers: [UsersService], // Register the UserService
  exports: [UsersService], // Export UserService if needed in other modules
})
export class UsersModule {}
