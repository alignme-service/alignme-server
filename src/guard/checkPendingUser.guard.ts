import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entites/user.entity';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { JoinStatus } from '../user/constant/join-status.enum';
import { UserRole } from '../user/types/userRole';
import { Instructor } from '../user/entites/instructor.entity';
import { Member } from '../user/entites/member.entity';

@Injectable()
export default class CheckPendingUserGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Instructor)
    private readonly instructorRepository: Repository<Instructor>,
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const accessToken = request.headers['authorization']?.split(' ')[1];

    const { userId } = this.authService.decodeAccessToken(accessToken);

    if (!accessToken) {
      throw new UnauthorizedException('require get accessToken');
    }

    // 직접 DB 조회
    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
    });

    if (!user) {
      throw new NotFoundException('Not found User');
    }

    if (user.role === UserRole.INSTRUCTOR) {
      const instructor = await this.instructorRepository.findOne({
        where: { user: { id: user.id } },
      });
      if (instructor.joinStatus === JoinStatus.PENDING) {
        throw new ForbiddenException({
          status: 'PENDING',
          message: '가입 승인 대기 중입니다.',
          code: 'USER_PENDING',
        });
      }
    }

    if (user.role === UserRole.MEMBER) {
      const member = await this.memberRepository.findOne({
        where: { user: { id: user.id } },
      });
      if (member.joinStatus === JoinStatus.PENDING) {
        throw new ForbiddenException({
          status: 'PENDING',
          message: '가입 승인 대기 중입니다.',
          code: 'USER_PENDING',
        });
      }
    }

    return true;
  }
}
