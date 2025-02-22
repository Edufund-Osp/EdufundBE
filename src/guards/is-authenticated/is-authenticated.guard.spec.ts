import { Test, TestingModule } from '@nestjs/testing';
import { IsAuthenticatedGuard } from './is-authenticated.guard';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../users/schemas/users.schema';
import { UnauthorizedException } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';
import { Types } from 'mongoose';

describe('IsAuthenticatedGuard', () => {
    let guard: IsAuthenticatedGuard;
    let jwtService: JwtService;
    let userModel: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                IsAuthenticatedGuard,
                {
                    provide: JwtService,
                    useValue: {
                        verifyAsync: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(User.name),
                    useValue: {
                        findById: jest.fn(),
                    },
                },
            ],
        }).compile();

        guard = module.get<IsAuthenticatedGuard>(IsAuthenticatedGuard);
        jwtService = module.get<JwtService>(JwtService);
        userModel = module.get(getModelToken(User.name));
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    it('should throw UnauthorizedException when no token is provided', async () => {
        const context = createMock<ExecutionContext>({
            switchToHttp: () => ({
                getRequest: () => ({
                    headers: {},
                }),
            }),
        });

        await expect(guard.canActivate(context)).rejects.toThrow(
            new UnauthorizedException('No authentication token provided'),
        );
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
        const mockUserId = new Types.ObjectId();
        const context = createMock<ExecutionContext>({
            switchToHttp: () => ({
                getRequest: () => ({
                    headers: {
                        authorization: 'Bearer valid_token',
                    },
                }),
            }),
        });

        jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
            sub: mockUserId,
        });

        jest.spyOn(userModel, 'findById').mockResolvedValue(null);

        await expect(guard.canActivate(context)).rejects.toThrow(
            new UnauthorizedException('User no longer exists'),
        );
    });

    it('should pass and add user to request when valid token and user exists', async () => {
        const mockUser = {
            _id: new Types.ObjectId(),
            email: 'test@example.com',
            roles: ['user'],
            name: 'Test User',
            isEmailVerified: true,
            isActive: true,
        };

        const mockRequest = {
            headers: {
                authorization: 'Bearer valid_token',
            },
        };

        const context = createMock<ExecutionContext>({
            switchToHttp: () => ({
                getRequest: () => mockRequest,
            }),
        });

        jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
            sub: mockUser._id,
        });

        jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser);

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
        expect(mockRequest['user']).toEqual(mockUser);
    });
});