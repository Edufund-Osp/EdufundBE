import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role } from '../../roles/roles.schema';

@Injectable()
export class IsOrganizationGuard implements CanActivate {
    constructor(
        @InjectModel(Role.name) private roleModel: Model<Role>
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Check if user exists in request (IsAuthenticatedGuard should be called first)
        if (!user) {
            throw new ForbiddenException('No authenticated user found');
        }

        try {
            // Find the organization role ID
            const orgRole = await this.roleModel.findOne({ name: 'organization' }).exec();
            
            if (!orgRole) {
                throw new ForbiddenException('Organization role not found in system');
            }

            // Check if user has the organization role
            const hasOrgRole = user.roles.some(roleId => 
                roleId.toString() === orgRole._id.toString()
            );

            if (!hasOrgRole) {
                throw new ForbiddenException('User is not an organization');
            }

            // Add organization flag to request for convenience
            request.isOrganization = true;

            return true;
        } catch (error) {
            if (error instanceof ForbiddenException) {
                throw error;
            }
            throw new ForbiddenException('Failed to verify organization status');
        }
    }
}