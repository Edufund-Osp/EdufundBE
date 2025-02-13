import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { GetUserDto } from './users.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    async login(@Query() getUserDto: GetUserDto) {
        return this.usersService.findOne(getUserDto);
    }
}
