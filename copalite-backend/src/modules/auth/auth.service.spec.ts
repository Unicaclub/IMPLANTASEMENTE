import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const userRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
  } as any;

  const refreshTokenRepo = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation(d => d),
    save: jest.fn().mockImplementation(e => ({ id: 'rt-1', ...e })),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  } as any;

  const jwtService = {
    verify: jest.fn(),
    sign: jest.fn().mockReturnValue('signed-token'),
  } as any;

  const configService = {
    get: jest.fn().mockImplementation((key: string, fallback?: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
      return fallback;
    }),
    getOrThrow: jest.fn().mockImplementation((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
      throw new Error(`Missing env var: ${key}`);
    }),
  } as any;

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(userRepo, refreshTokenRepo, jwtService, configService);
  });

  it('should throw UnauthorizedException for invalid refresh token', async () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid');
    });

    await expect(service.refresh('bad-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should throw UnauthorizedException when refresh token is revoked', async () => {
    jwtService.verify.mockReturnValue({ sub: 'u1', email: 'test@test.com' });
    refreshTokenRepo.findOne.mockResolvedValue(null); // not found = revoked

    await expect(service.refresh('revoked-token')).rejects.toBeInstanceOf(UnauthorizedException);
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

  it('should revoke token on logout', async () => {
    await service.logout('some-token');
    expect(refreshTokenRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ tokenHash: expect.any(String) }),
      expect.objectContaining({ revokedAt: expect.any(Date) }),
    );
  });

  it('should rotate token on refresh — revoke old, persist new', async () => {
    const storedToken = { id: 'rt-1', tokenHash: 'abc', revokedAt: null };
    jwtService.verify.mockReturnValue({ sub: 'u1', email: 'test@test.com' });
    refreshTokenRepo.findOne.mockResolvedValue(storedToken);
    userRepo.findOne.mockResolvedValue({ id: 'u1', email: 'test@test.com', status: 'active' });

    const result = await service.refresh('valid-token');

    // Old token was revoked
    expect(storedToken.revokedAt).not.toBeNull();
    expect(refreshTokenRepo.save).toHaveBeenCalled();

    // New tokens generated
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('should persist refresh token hash on login', async () => {
    const bcryptModule = require('bcrypt');
    jest.spyOn(bcryptModule, 'compare').mockResolvedValue(true);

    userRepo.findOne.mockResolvedValue({
      id: 'u1',
      email: 'valid@copalite.io',
      fullName: 'Valid User',
      passwordHash: '$2b$12$hashed',
      status: 'active',
    });

    const result = await service.login({ email: 'valid@copalite.io', password: '123456' });

    // Token was persisted in DB
    expect(refreshTokenRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );
    expect(refreshTokenRepo.save).toHaveBeenCalled();
    expect(result.accessToken).toBeDefined();
    expect(result.user.id).toBe('u1');
  });

  it('should reject refresh after logout (full revocation flow)', async () => {
    // Step 1: logout revokes the token
    await service.logout('token-to-revoke');
    expect(refreshTokenRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ tokenHash: expect.any(String) }),
      expect.objectContaining({ revokedAt: expect.any(Date) }),
    );

    // Step 2: refresh with same token fails because DB returns null (revoked)
    jest.clearAllMocks();
    jwtService.verify.mockReturnValue({ sub: 'u1', email: 'test@test.com' });
    refreshTokenRepo.findOne.mockResolvedValue(null); // revoked token not found

    await expect(service.refresh('token-to-revoke')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should revoke all user tokens', async () => {
    await service.revokeAllUserTokens('u1');
    expect(refreshTokenRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1' }),
      expect.objectContaining({ revokedAt: expect.any(Date) }),
    );
  });
});
