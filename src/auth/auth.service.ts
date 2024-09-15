import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from 'src/user/entites/user.entity';
import { ProfileService } from 'src/profile/profile.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Auth } from './entites/auth.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly profileService: ProfileService,

    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,
  ) {}

  async validateUser(payload: {
    kakaoMemberId: number;
    nickname: string;
    createdAt: Date;
    profile_image: string;
  }): Promise<Auth> {
    const { kakaoMemberId, nickname, createdAt, profile_image } =
      payload;

    const findAlreadyMember = await this.findkakaoMemberId(kakaoMemberId);

    if (findAlreadyMember === null) {
      await this.authRepository.save({
        kakaoMemberId,
      });

      await this.userService.create({
        kakaoMemberId,
        nickname,
        createdAt,
      });

      await this.profileService.updateProfileImage(
        kakaoMemberId,
        profile_image,
      );
    }

    return findAlreadyMember;
  }

  async generateAccessToken(user: User): Promise<string> {
    const payload = { sub: user.id };
    return this.jwtService.sign(payload);
  }

  async generateRefreshToken(user: User): Promise<string> {
    const payload = { sub: user.id };
    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userService.findById(payload.sub);

      if (!user || user.authTokens.refreshToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      const newAccessToken = this.jwtService.sign({
        sub: user.id,
        username: user.nickname,
      });
      const newRefreshToken = this.jwtService.sign(
        { sub: user.id },
        { expiresIn: '7d' },
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

  async setCurrentRefreshToken(
    kakaoMemberId: number,
    refreshToken: string,
  ): Promise<void> {
    const auth = await this.authRepository.findOne({
      where: { kakaoMemberId },
    });

    if (!auth) {
      throw new NotFoundException(
        `KakaoMemberId ${kakaoMemberId}를 가진 인증 정보를 찾을 수 없습니다.`,
      );
    }

    auth.refreshToken = refreshToken;
    await this.authRepository.save(auth);
    // await this.authRepository.update(kakaoMemberId, { refreshToken });
  }

  async logout(userId: number) {
    await this.userService.removeRefreshToken(userId);
  }

  private async findkakaoMemberId(kakaoMemberId: number): Promise<Auth | null> {
    try {
      const findUser = await this.authRepository.findOne({
        where: { kakaoMemberId },
      });
      return findUser;
    } catch {
      return null;
    }
  }
}
