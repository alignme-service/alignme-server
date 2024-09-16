import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entites/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Auth } from './entites/auth.entity';
import { Repository } from 'typeorm';

export type ReturnValidateUser = User & {
  isAleradyUser: boolean;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,

    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async validateUser(payload: {
    kakaoMemberId: number;
    email: string;
    nickname: string;
    createdAt: Date;
    // profile_image: string;
  }): Promise<ReturnValidateUser | null> {
    const { kakaoMemberId, email, nickname, createdAt } = payload;

    let isAleradyUser = false;

    const findUser: User = await this.findkakaoMemberId(kakaoMemberId);

    if (findUser === null) {
      isAleradyUser = true;

      this.userRepository.create({
        kakaoMemberId,
        email,
        nickname,
        createdAt,
      });

      await this.userRepository.save({
        kakaoMemberId,
        email,
        nickname,
        createdAt,
      });
    }
    return { ...findUser, isAleradyUser: isAleradyUser };
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
      const authTokenInfo = await this.findById(payload.sub);

      if (!authTokenInfo || authTokenInfo.refreshToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      const newAccessToken = this.jwtService.sign({
        sub: authTokenInfo.id,
        // username: user.nickname,
      });
      const newRefreshToken = this.jwtService.sign(
        { sub: authTokenInfo.id },
        { expiresIn: '7d' },
      );

      await this.updateRefreshToken(+authTokenInfo.id, newRefreshToken);

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
    const user = await this.userRepository.findOne({
      where: { kakaoMemberId },
    });

    let auth = await this.authRepository.findOne({
      where: { id: user.id },
    });

    console.log('user!', auth);

    if (!user) {
      throw new NotFoundException(
        `KakaoMemberId ${kakaoMemberId}를 가진 인증 정보를 찾을 수 없습니다.`,
      );
    }

    if (!auth) {
      auth = this.authRepository.create({ user });
    }

    auth.refreshToken = refreshToken;
    await this.authRepository.save(auth);
  }

  async create(userData: Partial<User>): Promise<User> {
    const newUser = this.userRepository.create(userData);

    return this.userRepository.save(newUser);
  }

  async logout(kakaoMemberid: number) {
    await this.removeRefreshToken(kakaoMemberid);
  }

  private async findById(id: string): Promise<Auth | undefined> {
    try {
      return await this.authRepository.findOne({ where: { id } });
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new Error('Failed to find user');
    }
  }

  private async updateRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    try {
      await this.authRepository.update(userId, { refreshToken });
    } catch (error) {
      console.error('Error updating refresh token:', error);
      throw new Error('Failed to update refresh token');
    }
  }

  private async removeRefreshToken(kakaoMemberId: number): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { kakaoMemberId },
      });
      if (!user) {
        throw new Error('User not found');
      }
      await this.authRepository.delete({ user: { id: user.id } });
    } catch (error) {
      console.error('Error removing refresh token:', error);
      throw new Error('Failed to remove refresh token');
    }
  }

  private async findkakaoMemberId(kakaoMemberId: number): Promise<User | null> {
    try {
      const findUser = await this.userRepository.findOne({
        where: { kakaoMemberId },
      });
      return findUser;
    } catch {
      return null;
    }
  }
}
