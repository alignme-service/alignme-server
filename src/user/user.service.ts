import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Instructor } from './entites/instructor.entity';
import { AuthService } from '../auth/auth.service';
import { User } from './entites/user.entity';
import { UserRole } from './types/userRole';
import { Studio } from '../studio/entites/studio.entity';
import { BaseCreateUserDto } from './dto/baseCreateUser.dto';
import { CreateMemberDto } from './dto/createMember.dto';
import { Profile } from '../profile/entities/profile.entity';
import { Member } from './entites/member.entity';
import { JoinStatus } from './constant/join-status.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Studio)
    private studioRepository: Repository<Studio>,
    @InjectRepository(Instructor)
    private instructorRepository: Repository<Instructor>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    private dataSource: DataSource,
  ) {}

  async createMember(accessToken: string, createMemberDto: CreateMemberDto) {
    if (!createMemberDto.studioName) {
      throw new NotFoundException('invalid Studio name');
    }

    const member = await this.createStudioAndProfile(accessToken);

    if (createMemberDto.name) {
      member.name = createMemberDto.name;
    }

    member.role = UserRole.MEMBER;

    // 강사 찾은후 해당 강사로 편입
    const findInstructor = await this.instructorRepository.findOne({
      where: { id: createMemberDto.instructorId },
    });

    if (!findInstructor) {
      throw new NotFoundException('Instructor not found');
    }

    const studio = await this.studioRepository.findOne({
      where: { studioName: createMemberDto.studioName },
    });

    if (studio) {
      member.studio = studio;
    } else {
      throw new NotFoundException('Not Found Studio');
    }

    await this.userRepository.save(member);

    const createdMember = this.memberRepository.create({
      user: member,
      instructor: findInstructor,
    });

    createdMember.joinStatus = JoinStatus.PENDING;

    await this.memberRepository.save(createdMember);

    await this.checkPendingUser(accessToken);

    return createdMember;
  }

  async createInstructor(
    accessToken: string,
    createInstructor: BaseCreateUserDto,
  ) {
    if (!createInstructor.studioName) {
      throw new NotFoundException('invalid Studio name');
    }

    const instructor = await this.createStudioAndProfile(accessToken);

    if (createInstructor.name) {
      instructor.name = createInstructor.name;
    }

    instructor.role = UserRole.INSTRUCTOR;

    const newInstructor = this.instructorRepository.create({
      user: instructor,
    });

    newInstructor.joinStatus = JoinStatus.PENDING;

    if (createInstructor.isMainInstructor) {
      newInstructor.isMainInstructor = true;
    }

    if (createInstructor.studioName) {
      try {
        let studio: Studio;
        // eslint-disable-next-line prefer-const
        studio = await this.studioRepository.findOne({
          where: { studioName: createInstructor.studioName },
          // relations: ['mainInstructor'],
        });
        // 일반 강사일때 studio 체크
        if (!newInstructor.isMainInstructor) {
          if (studio.studioName) {
            instructor.studio = studio;
            await this.studioRepository.save(instructor.studio);
          }
        } else if (newInstructor.isMainInstructor) {
          // 대표강사 가입 최초 1명으로 제한
          // if (studio && studio.mainInstructor.isMainInstructor) {
          //   throw new ConflictException('Already exist main instructor');
          // }

          // 대표강사일때 studio 체크 및 없으면 생성
          instructor.studio.studioName = createInstructor.studioName;
          instructor.studio.studioRegionName =
            createInstructor.studioRegionName || '';
          // instructor.studio.mainInstructor = newInstructor;

          await this.studioRepository.save(instructor.studio);
        }
      } catch {
        throw new NotFoundException('Not Found studio');
      }
    }

    await this.instructorRepository.save(newInstructor);
    await this.userRepository.save(instructor);

    // await this.checkPendingUser(accessToken);

    return {
      instructorId: newInstructor.id,
      isMainInstructor: newInstructor.isMainInstructor,
      studioName: instructor.studio.studioName,
      studioRegion: instructor.studio.studioRegionName || '',
    };
  }

  private async createStudioAndProfile(accessToken: string): Promise<User> {
    const { userId } = this.authService.decodeTokenUserId(accessToken);

    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
      relations: ['profile', 'studio'],
    });

    // if (user.profile) {
    //   throw new NotFoundException('Already joined User');
    // }

    const studio = this.studioRepository.create();

    if (!user.profile) {
      const newProfile = this.profileRepository.create({
        user,
      });
      newProfile.updatedAt = new Date();
      user.profile = await this.profileRepository.save(newProfile);
    }

    if (!user) {
      throw new NotFoundException('Not Found Auth User');
    }

    user.studio = studio;
    //
    return user;
  }

  async getInstructorsOnStudio(
    page: number = 1,
    limit: number = 10,
    accessToken: string,
  ) {
    const { userId } = this.authService.decodeTokenUserId(accessToken);

    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
      relations: ['studio', 'profile'],
    });

    const [instructors, total] = await this.instructorRepository.findAndCount({
      where: {
        user: { studio: { id: user.studio.id } },
        joinStatus: JoinStatus.APPROVED,
      },
      take: limit,
      skip: (page - 1) * limit,
      order: { id: 'ASC' },
      relations: ['user', 'user.profile'],
    });

    const instructorList = instructors.map((instructor) => ({
      id: instructor.id,
      kakaoMemberId: instructor.user.kakaoMemberId,
      name: instructor.user.name,
      createdAt: instructor.user.createdAt,
      profileImage: instructor.user.profile?.profile_image || null,
    }));

    return {
      data: {
        instructors: instructorList,
      },
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMembers(
    instructorId: string,
    page: number = 1,
    limit: number = 5,
    accessToken: string,
  ) {
    // Todo: instructorId로 강사 하위 회원목록 필터링

    const { userId } = this.authService.decodeTokenUserId(accessToken);

    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
      relations: ['studio', 'instructor'],
    });

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    const [users, total] = await queryBuilder
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.member', 'member')
      .where('user.studio.id = :studioId', { studioId: user.studio.id })
      .andWhere('user.role = :role', { role: UserRole.MEMBER })
      .andWhere('member.joinStatus = :status', { status: JoinStatus.APPROVED })
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const members = users.map((user) => ({
      id: user.member.id,
      kakaoMemberId: user.kakaoMemberId,
      name: user.name,
      createdAt: user.createdAt,
      profileImage: user.profile?.profile_image || null,
    }));

    return {
      data: {
        members,
      },
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getJoinRequests(
    type: UserRole,
    page: number = 1,
    limit: number = 10,
    accessToken: string,
  ) {
    const { userId } = this.authService.decodeTokenUserId(accessToken);

    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
      relations: ['studio', 'instructor', 'member'],
    });

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.studio', 'studio')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.studioId = :studioId', { studioId: user.studio.id });

    if (type === UserRole.INSTRUCTOR.toUpperCase()) {
      queryBuilder
        .leftJoinAndSelect('user.instructor', 'instructor')
        .andWhere('instructor.joinStatus = :status', { status: 'pending' })
        .andWhere('instructor.isMainInstructor = :isMain', { isMain: false });
    } else if (type === UserRole.MEMBER.toUpperCase()) {
      queryBuilder
        .leftJoinAndSelect('user.member', 'member')
        .andWhere('member.joinStatus = :status', { status: 'pending' });
    } else {
      throw new NotFoundException('Invalid user type');
    }

    const [pendingUsers, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const formattedUsers = this.formatUsers(pendingUsers);

    return this.paginateResponse(formattedUsers, total, page, limit);
  }

  private formatUsers(users: User[]) {
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      createdAt: user.createdAt,
      profileImage: user.profile?.profile_image || null,
    }));
  }

  private paginateResponse(
    data: any[],
    total: number,
    page: number,
    limit: number,
  ) {
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 유저가 소속된 강사 변경하기
  async changeInstructor(
    accessToken: string,
    instructorId: string,
    memberId: string,
  ) {
    const { userId } = this.authService.decodeTokenUserId(accessToken);

    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
      relations: ['instructor'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const instructor = await this.instructorRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['members'],
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    const member = await this.memberRepository.findOne({
      where: { id: memberId },
      relations: ['instructor'],
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.instructor.id === instructor.id) {
      throw new BadRequestException('Already associated with the instructor');
    }

    // 이전 강사와의 관계 제거
    member.instructor = instructor;
    await this.memberRepository.save(member);

    return member;
  }

  async leaveUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
      relations: ['instructor'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.INSTRUCTOR && user.instructor.isMainInstructor) {
      throw new BadRequestException('Main instructor cannot leave');
    }

    await this.authService.leaveUser(user.kakaoMemberId);
  }

  // 유저 가입 요청 승인
  async approveJoinRequest(selectUserId: string, isApprove: JoinStatus) {
    // 승인/거절 대상의 user 찾기
    const user = await this.userRepository.findOne({
      where: { id: selectUserId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 가입 거절
    if (isApprove === JoinStatus.REJECTED) {
      await this.instructorRepository.delete({ user });

      await this.authService.leaveUser(user.kakaoMemberId);
      return;
    }

    if (user.role === UserRole.INSTRUCTOR) {
      await this.approveInstructorOrMember(user, UserRole.INSTRUCTOR);
    } else if (user.role === UserRole.MEMBER) {
      await this.approveInstructorOrMember(user, UserRole.MEMBER);
    } else {
      throw new BadRequestException('Invalid user role for approval');
    }

    return user;
  }

  // check user.role check
  async findUserWithRole(userId: number): Promise<UserRole> {
    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.role;
  }

  // 가입승인 대기중인 유저 상태
  async joinPendingProcess(accessToken: string) {
    const { userId } = this.authService.decodeTokenUserId(accessToken);

    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
      relations: ['instructor', 'member'],
    });

    if (user.role === UserRole.INSTRUCTOR) {
    }
  }

  // check IsMainInstructor
  async findMainInstructor(userId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: userId },
      relations: ['instructor'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.instructor.isMainInstructor;
  }

  private async approveInstructorOrMember(user: User, role: UserRole) {
    if (role === UserRole.INSTRUCTOR) {
      const instructor = await this.instructorRepository.findOne({
        where: { user: { id: user.id } },
      });

      if (!instructor) {
        throw new NotFoundException('Instructor not found');
      }

      instructor.joinStatus = JoinStatus.APPROVED;
      await this.instructorRepository.save(instructor);

      return;
    }

    const member = await this.memberRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    member.joinStatus = JoinStatus.APPROVED;
    await this.memberRepository.save(member);
  }

  async checkPendingUser(accessToken: string) {
    const { userId } = this.authService.decodeTokenUserId(accessToken);

    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
      relations: ['instructor', 'member'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.INSTRUCTOR) {
      if (user.instructor.joinStatus === JoinStatus.PENDING) {
        throw new ForbiddenException({
          status: 'PENDING',
          message: '가입 승인 대기 중입니다.',
          code: 'USER_PENDING',
        });
      }

      return;
    }

    if (user.role === UserRole.MEMBER) {
      if (user.member.joinStatus === JoinStatus.PENDING) {
        throw new ForbiddenException({
          status: 'PENDING',
          message: '가입 승인 대기 중입니다.',
          code: 'USER_PENDING',
        });
      }
      return;
    }
  }
}
