import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { IsNull, Repository } from 'typeorm';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UserEntity } from '../users/entities/user.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshSecret: string;
  private readonly refreshExpiration: string;
  private readonly refreshExpirationMs: number;
  private readonly accessExpirationSeconds: number;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepo: Repository<RefreshTokenEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.refreshExpiration = '7d';
    this.refreshExpirationMs = 7 * 24 * 60 * 60 * 1000;
    this.accessExpirationSeconds = 15 * 60;
  }

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) {
      throw new ConflictException('Email ja registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
    });
    const saved = await this.userRepo.save(user);

    const tokens = await this.generateAndPersistTokens(saved.id, saved.email);
    return {
      ...tokens,
      user: { id: saved.id, email: saved.email, fullName: saved.fullName },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: ['id', 'email', 'fullName', 'passwordHash', 'status'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    const tokens = await this.generateAndPersistTokens(user.id, user.email);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Validate token exists in DB and is not revoked
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.refreshTokenRepo.findOne({
      where: { tokenHash, revokedAt: IsNull() },
    });

    if (!stored) {
      this.logger.warn(`Refresh token not found or revoked for user ${payload.sub}`);
      throw new UnauthorizedException('Refresh token revoked or not found');
    }

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (user?.status !== 'active') {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Rotation: revoke old token, issue new one
    stored.revokedAt = new Date();
    await this.refreshTokenRepo.save(stored);

    return this.generateAndPersistTokens(user.id, user.email);
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return;

    const tokenHash = this.hashToken(refreshToken);
    await this.refreshTokenRepo.update(
      { tokenHash, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async revokeAllUserTokens(userId: string) {
    await this.refreshTokenRepo.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  private async generateAndPersistTokens(userId: string, email: string) {
    const payload: JwtPayload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiration,
    });

    // Persist refresh token hash
    const tokenHash = this.hashToken(refreshToken);
    await this.refreshTokenRepo.save(this.refreshTokenRepo.create({
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + this.refreshExpirationMs),
    }));

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: new Date(Date.now() + this.accessExpirationSeconds * 1000).toISOString(),
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
