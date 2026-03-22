import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const userRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
  } as any;

  const jwtService = {
    verify: jest.fn(),
    sign: jest.fn().mockReturnValue('signed-token'),
  } as any;

  const configService = {
    get: jest.fn().mockImplementation((key: string, fallback: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      return fallback;
    }),
  } as any;

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(userRepo, jwtService, configService);
  });

  it('should throw UnauthorizedException for invalid refresh token', async () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid');
    });

    await expect(service.refresh('bad-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should throw UnauthorizedException when user is inactive during login', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'u1',
      email: 'inactive@copalite.io',
      fullName: 'Inactive',
      passwordHash: 'hash',
      status: 'inactive',
    });

    await expect(service.login({ email: 'inactive@copalite.io', password: '123456' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
