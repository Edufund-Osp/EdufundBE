import { Test, TestingModule } from '@nestjs/testing';
import { IsUserGuard } from './is-user.guard';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';

describe('IsUserGuard', () => {
  let guard: IsUserGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IsUserGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<IsUserGuard>(IsUserGuard);
    jwtService = module.get<JwtService>(JwtService);
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
      new UnauthorizedException('No token provided'),
    );
  });

  it('should throw UnauthorizedException when invalid token is provided', async () => {
    const context = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Bearer invalid_token',
          },
        }),
      }),
    });

    jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error());

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid token'),
    );
  });

  it('should pass and add email to request when valid token is provided', async () => {
    const mockEmail = 'test@example.com';
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
      email: mockEmail,
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockRequest['userEmail']).toBe(mockEmail);
  });
});