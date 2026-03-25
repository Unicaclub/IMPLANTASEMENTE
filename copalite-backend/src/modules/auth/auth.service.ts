import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UserEntity } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly refreshSecret: string;
  private readonly refreshExpiration: string;
  private readonly accessExpirationSeconds: number;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.refreshExpiration = '7d';
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

    const tokens = this.generateTokens(saved.id, saved.email);
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

    const tokens = this.generateTokens(user.id, user.email);

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
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.refreshSecret,
      });

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (user?.status !== 'active') {
        throw new UnauthorizedException('User not found or inactive');
      }

      return this.generateTokens(user.id, user.email);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  private generateTokens(userId: string, email: string) {
    const payload: JwtPayload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiration,
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: new Date(Date.now() + this.accessExpirationSeconds * 1000).toISOString(),
    };
  }
}
