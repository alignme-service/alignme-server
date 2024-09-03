import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from 'src/user/entites/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(payload: {
    id: string;
    email: string;
    name: string;
    nickname: string;
  }): Promise<User> {
    let user = await this.userService.findByEmail(payload.email);
    if (!user) {
      user = await this.userService.create(payload);
    }
    return user;
  }

  async generateAccessToken(user: User): Promise<string> {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }

  async generateRefreshToken(user: User): Promise<string> {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userService.findById(payload.sub);

      if (!user || user.refreshToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      const newAccessToken = this.jwtService.sign({
        sub: user.id,
        username: user.nickname,
      });
      const newRefreshToken = this.jwtService.sign(
        { sub: user.id },
        { expiresIn: '1m' },
      );

      await this.userService.updateRefreshToken(+user.id, newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: number) {
    await this.userService.removeRefreshToken(userId);
  }
}
