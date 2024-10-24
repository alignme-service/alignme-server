import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entites/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Auth } from './entites/auth.entity';
import { DataSource, Repository } from 'typeorm';
import { UserRole } from '../user/types/userRole';
import { UserService } from '../user/user.service';

export type ReturnValidateUser = User & {
  isAlready: boolean;
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,

    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly userService: UserService,

    private dataSource: DataSource,
  ) {}

  async autoLogin(accessToken: string, refreshToken: string) {
    const { isExpired, user, isMainInstructor } =
      await this.verifyRefreshToken(refreshToken);

    await this.userService.checkPendingUser(accessToken);

    return { isExpired, user, isMainInstructor };
  }

  async validateUser(payload: {
    kakaoMemberId: number;
    email: string;
    name: string;
    // profile_image: string;
  }): Promise<ReturnValidateUser | null> {
    const { kakaoMemberId, email, name } = payload;

    let isAlready = true;

    const findUser: User = await this.findkakaoMemberId(kakaoMemberId);

    // 유저없을때 신규가입 처리 + 토큰 발급
    if (findUser === null) {
      isAlready = false;

      this.userRepository.create({
        kakaoMemberId,
        email,
        name,
        createdAt: new Date(),
      });

      await this.userRepository.save({
        kakaoMemberId,
        email,
        name,
        createdAt: new Date(),
      });

      const accessToken = await this.generateAccessToken(
        kakaoMemberId,
        email,
        name,
      );
      const refreshToken = await this.generateRefreshToken(kakaoMemberId);
      await this.setCurrentRefreshToken(kakaoMemberId, refreshToken);

      return {
        isAlready,
        accessToken,
        refreshToken,
        ...findUser,
      };
    }

    // 유저 있을때 리프레시토큰 유효성 검사
    const { isExpired } = await this.verifyRefreshToken(
      findUser.auth.refreshToken,
    );

    // 유저있고 리프레시토큰 만료시 토큰 재발급
    if (isExpired) {
      const newAccessToken = await this.generateAccessToken(
        kakaoMemberId,
        email,
        name,
      );
      const newRefreshToken = await this.generateRefreshToken(kakaoMemberId);

      await this.setCurrentRefreshToken(kakaoMemberId, newRefreshToken);

      return {
        isAlready,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        ...findUser,
      };
    }

    // 유저있고 리프레시토큰 유효시 access token만 재발급
    const accessToken = await this.generateAccessToken(
      kakaoMemberId,
      email,
      name,
    );
    return {
      isAlready,
      accessToken,
      refreshToken: findUser.auth.refreshToken,
      ...findUser,
    };
  }

  async generateAccessToken(
    userId: number,
    email: string,
    name: string,
  ): Promise<string> {
    const payload = { userId, email, name };

    return this.jwtService.sign(payload);
  }

  async generateRefreshToken(userId: number): Promise<string> {
    const payload = { sub: userId };
    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  async refreshToken(refreshToken: string, accessToken: string) {
    const userInfo = this.decodeTokenUserId(accessToken);
    const authTokenInfo = await this.findById(userInfo.userId);

    if (!authTokenInfo) {
      throw new Error('Invalid user info');
    }

    const { isExpired } = await this.verifyRefreshToken(refreshToken);

    if (isExpired) {
      // throw new UnauthorizedException({
      //   errorCode: 'EXPIRED_TOKEN',
      //   message: 'expired token',
      // });

      const newAccessToken = this.jwtService.sign({
        userId: userInfo.userId,
        email: userInfo.email,
        name: userInfo.name,
      });
      const newRefreshToken = this.jwtService.sign(
        { userId: userInfo.userId, email: userInfo.email, name: userInfo.name },
        { expiresIn: '7d' },
      );

      await this.updateRefreshToken(authTokenInfo.id, newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    }
  }

  decodeTokenUserId(token: string): {
    userId: string;
    email: string;
    name: string;
  } {
    try {
      // const decoded = this.jwtService.verify(token);
      const decoded = this.jwtService.decode(token);

      const { userId, email, name } = decoded;

      return { userId, email, name };
    } catch {
      throw new UnauthorizedException('failed decoded token');
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
      where: {
        user: {
          id: user.id,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        `KakaoMemberId ${kakaoMemberId}를 가진 인증 정보를 찾을 수 없습니다.`,
      );
    }

    if (!auth) {
      auth = this.authRepository.create({ user });
    }

    auth.refreshToken = refreshToken;
    await this.authRepository.save(auth);
  }

  async leaveUser(userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.userRepository.findOne({
        where: { kakaoMemberId: userId },
        relations: ['profile', 'instructor', 'member'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      await queryRunner.manager.remove(user);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async findById(id: string): Promise<User | undefined> {
    try {
      return await this.userRepository.findOne({
        where: { kakaoMemberId: +id },
      });
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new Error('Failed to find user');
    }
  }

  private async updateRefreshToken(
    authId: string,
    refreshToken: string,
  ): Promise<void> {
    try {
      await this.authRepository.update(authId, { refreshToken });
    } catch (error) {
      console.error('Error updating refresh token:', error);
      throw new Error('Failed to update refresh token');
    }
  }

  // Todo: 회원 탈퇴로 변경
  // private async removeAccessToken(kakaoMemberId: number): Promise<void> {
  //   try {
  //     const user = await this.userRepository.findOne({
  //       where: { kakaoMemberId },
  //     });
  //     if (!user) {
  //       throw new Error('User not found');
  //     }
  //     await this.authRepository.delete({ user: { id: user.id } });
  //   } catch (error) {
  //     console.error('Error removing refresh token:', error);
  //     throw new Error('Failed to remove refresh token');
  //   }
  // }

  private async findkakaoMemberId(kakaoMemberId: number): Promise<User | null> {
    try {
      const findUser = await this.userRepository.findOne({
        where: { kakaoMemberId },
        relations: ['auth', 'instructor'],
      });
      return findUser;
    } catch {
      return null;
    }
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<{ isExpired: boolean; user: User; isMainInstructor: boolean }> {
    const payload = this.jwtService.decode(refreshToken);

    if (!payload) {
      throw new NotFoundException('Invalid token');
    }
    const auth = await this.authRepository.findOne({
      where: { user: { kakaoMemberId: +payload.sub } },
      relations: ['user'],
    });

    if (!auth) {
      throw new NotFoundException('Invalid user');
    }

    let isMainInstructor = false;

    // 메인 강사인지 체크

    if (auth.user.role === UserRole.INSTRUCTOR) {
      const user = await this.userRepository.findOne({
        where: { kakaoMemberId: +payload.sub },
        relations: ['instructor'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.instructor) {
        isMainInstructor = user.instructor.isMainInstructor;
      }
    }

    // 토큰 만료 7일 전인지 확인
    const expirationDate = new Date(payload.exp * 1000);
    const now = new Date();
    // const sevenDays = 7 * 24 * 60 * 60 * 1000; // 7일을 밀리초로 표현
    const isExpired = expirationDate.getTime() <= now.getTime();

    // const isNearExpiration =
    //   expirationDate.getTime() - now.getTime() < sevenDays;

    return { isExpired, user: auth.user, isMainInstructor };
  }
}
