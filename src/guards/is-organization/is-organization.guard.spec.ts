import { Test, TestingModule } from '@nestjs/testing';
import { IsOrganizationGuard } from './is-organization.guard';
import { getModelToken } from '@nestjs/mongoose';
import { Role } from '../../roles/roles.schema';
import { ForbiddenException } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';
import { Types } from 'mongoose';

describe('IsOrganizationGuard', () => {
    let guard: IsOrganizationGuard;
    let roleModel: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                IsOrganizationGuard,
                {
                    provide: getModelToken(Role.name),
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
            ],
        }).compile();

        guard = module.get<IsOrganizationGuard>(IsOrganizationGuard);
        roleModel = module.get(getModelToken(Role.name));
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    it('should throw ForbiddenException when no user in request', async () => {
        const context = createMock<ExecutionContext>({
            switchToHttp: () => ({
                getRequest: () => ({}),
            }),
        });

        await expect(guard.canActivate(context)).rejects.toThrow(
            new ForbiddenException('No authenticated user found'),
        );
    });

    it('should throw ForbiddenException when user does not have organization role', async () => {
        const orgRoleId = new Types.ObjectId();
        const otherRoleId = new Types.ObjectId();

        const mockRequest = {
            user: {
                roles: [otherRoleId],
            },
        };

        const context = createMock<ExecutionContext>({
            switchToHttp: () => ({
                getRequest: () => mockRequest,
            }),
        });

        jest.spyOn(roleModel, 'findOne').mockResolvedValue({
            _id: orgRoleId,
            name: 'organization',
        });

        await expect(guard.canActivate(context)).rejects.toThrow(
            new ForbiddenException('User is not an organization'),
        );
    });

    it('should pass when user has organization role', async () => {
        const orgRoleId = new Types.ObjectId();

        const mockRequest = {
            user: {
                roles: [orgRoleId],
            },
        };

        const context = createMock<ExecutionContext>({
            switchToHttp: () => ({
                getRequest: () => mockRequest,
            }),
        });

        jest.spyOn(roleModel, 'findOne').mockResolvedValue({
            _id: orgRoleId,
            name: 'organization',
        });

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
        expect(mockRequest.isOrganization).toBe(true);
    });
});