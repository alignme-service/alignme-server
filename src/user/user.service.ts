import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Instructor } from './entites/instructor.entity';
import { AuthService } from '../auth/auth.service';
import { User } from './entites/user.entity';
import { UserRole } from './types/userRole';
import { Studio } from '../studio/entites/studio.entity';
import { BaseCreateUserDto } from './dto/baseCreateUser.dto';
import { Profile } from '../profile/entities/profile.entity';
import { Member } from './entites/member.entity';
import { JoinStatus } from './constant/join-status.enum';
import ErrorCodes from '../constants/ErrorCodes';

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

  async getUserInfo(accessToken: string) {
    const { userId } = this.authService.decodeAccessToken(accessToken);

    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
      relations: ['profile', 'studio', 'instructor', 'member'],
    });

    if (!user) {
      throw new NotFoundException(ErrorCodes.ERR_11);
    }

    const { id, email, name, role, kakaoMemberId } = user;

    let isMainInstructor = false;
    if (role === UserRole.INSTRUCTOR) {
      isMainInstructor = user.instructor.isMainInstructor;
    }

    return {
      id,
      kakaoMemberId,
      email,
      name,
      role,
      isMainInstructor,
    };
  }

  // async createMember(accessToken: string, createMemberDto: CreateMemberDto) {
  //   if (!createMemberDto.studioName) {
  //     throw new NotFoundException(ErrorCodes.ERR_41);
  //   }
  //
  //   const { userId } = this.authService.decodeAccessToken(accessToken);
  //
  //   // const member = await this.createStudioAndProfile(
  //   //   accessToken,
  //   //   UserRole.MEMBER,
  //   // );
  //   const member: any = {};
  //
  //   if (createMemberDto.name) {
  //     member.name = createMemberDto.name;
  //   }
  //
  //   member.role = UserRole.MEMBER;
  //
  //   // 강사 찾은후 해당 강사로 편입
  //   const findInstructor = await this.instructorRepository.findOne({
  //     where: { id: createMemberDto.instructorId },
  //   });
  //
  //   if (!findInstructor) {
  //     throw new NotFoundException('Instructor not found');
  //   }
  //
  //   const studio = await this.studioRepository.findOne({
  //     where: { studioName: createMemberDto.studioName },
  //   });
  //
  //   if (studio) {
  //     member.studio = studio;
  //   } else {
  //     throw new NotFoundException('Not Found Studio');
  //   }
  //
  //   await this.userRepository.save(member);
  //
  //   const createdMember = this.memberRepository.create({
  //     user: member,
  //     instructor: findInstructor,
  //   });
  //
  //   createdMember.joinStatus = JoinStatus.PENDING;
  //
  //   await this.memberRepository.save(createdMember);
  //
  //   await this.checkPendingUser(accessToken);
  //
  //   return createdMember;
  // }
  async createMember(
    accessToken: string,
    studioId: string,
    instructorId: string,
  ) {
    const { userId } = this.authService.decodeAccessToken(accessToken);

    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
      relations: ['studio', 'profile'],
    });

    if (!user) {
      throw new NotFoundException(ErrorCodes.ERR_11);
    }

    user.studio = await this.studioRepository.findOne({
      where: { id: studioId },
    });

    user.role = UserRole.MEMBER;

    await this.userRepository.save(user);

    user.profile = this.profileRepository.create({
      user,
      profile_image: '',
      updatedAt: new Date(),
    });
    await this.profileRepository.save(user.profile);

    const instructor = await this.instructorRepository.findOne({
      where: { id: instructorId },
      relations: ['user'],
    });

    if (!instructor) {
      throw new NotFoundException(ErrorCodes.ERR_12);
    }

    const member = this.memberRepository.create({
      user,
      instructor,
      joinStatus: JoinStatus.PENDING,
    });

    await this.memberRepository.save(member);

    return member;
  }

  async createInstructor(
    accessToken: string,
    createInstructor: BaseCreateUserDto,
  ) {
    if (!createInstructor.studioName) {
      throw new NotFoundException('invalid Studio name');
    }

    const { userId } = this.authService.decodeAccessToken(accessToken);

    // 트랜잭션 사용
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        // 유저 찾기
        const findUser = await transactionalEntityManager.findOne(User, {
          where: { kakaoMemberId: +userId },
          relations: ['profile', 'studio', 'instructor'],
        });

        if (!findUser) {
          throw new NotFoundException('User not found');
        }

        // 유저 정보 업데이트
        findUser.name = createInstructor.name || findUser.name;
        findUser.role = UserRole.INSTRUCTOR;

        // Todo: 대표강사 존재 여부 후 2인 이상 가입 불가

        // 프로필 생성 또는 업데이트
        if (!findUser.profile) {
          const newProfile = transactionalEntityManager.create(Profile, {
            user: findUser,
            profile_image: '',
            updatedAt: new Date(),
          });
          await transactionalEntityManager.save(Profile, newProfile);

          findUser.profile = newProfile;
        }

        // 스튜디오 처리
        let studio = await transactionalEntityManager.findOne(Studio, {
          where: { studioName: createInstructor.studioName },
        });

        if (!studio && createInstructor.isMainInstructor) {
          studio = transactionalEntityManager.create(Studio, {
            studioName: createInstructor.studioName,
            studioRegionName: createInstructor.studioRegionName || '',
          });
          await transactionalEntityManager.save(Studio, studio);
        } else if (!studio && !createInstructor.isMainInstructor) {
          throw new NotFoundException(ErrorCodes.ERR_41);
        }

        findUser.studio = studio;
        await transactionalEntityManager.save(User, findUser);

        // Instructor 생성 및 저장
        const newInstructor = transactionalEntityManager.create(Instructor, {
          user: findUser,
          isMainInstructor: createInstructor.isMainInstructor || false,
          joinStatus: JoinStatus.PENDING,
        });
        const savedInstructor = await transactionalEntityManager.save(
          Instructor,
          newInstructor,
        );

        return {
          instructorId: savedInstructor.id,
          isMainInstructor: savedInstructor.isMainInstructor,
          studioName: studio.studioName,
          studioRegion: studio.studioRegionName || '',
        };
      },
    );
  }

  async getInstructorsOnStudio(
    page: number = 1,
    limit: number = 10,
    accessToken: string,
  ) {
    const { userId } = this.authService.decodeAccessToken(accessToken);

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

    const { userId } = this.authService.decodeAccessToken(accessToken);

    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
      relations: ['studio', 'instructor'],
    });

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    const [users, total] = await queryBuilder
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.member', 'member')
      .leftJoinAndSelect('member.instructor', 'instructor')
      .leftJoinAndSelect('instructor.user', 'instructorUser')
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
      onInstructor: user.member.instructor.user.name,
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
    const { userId } = this.authService.decodeAccessToken(accessToken);

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
    const { userId } = this.authService.decodeAccessToken(accessToken);

    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
      relations: ['instructor'],
    });

    if (!user) {
      throw new NotFoundException(ErrorCodes.ERR_11);
    }

    const instructor = await this.instructorRepository.findOne({
      // where: { user: { id: user.id } },
      where: { id: instructorId },
      relations: ['members'],
    });

    if (!instructor) {
      throw new NotFoundException(ErrorCodes.ERR_12);
    }

    const member = await this.memberRepository.findOne({
      where: { id: memberId },
      relations: ['instructor'],
    });

    if (!member) {
      throw new NotFoundException(ErrorCodes.ERR_13);
    }

    if (member.instructor.id === instructorId) {
      throw new BadRequestException(ErrorCodes.ERR_15);
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
      throw new NotFoundException(ErrorCodes.ERR_11);
    }

    if (user.role === UserRole.INSTRUCTOR && user.instructor.isMainInstructor) {
      throw new BadRequestException(ErrorCodes.ERR_14);
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
    const { userId } = this.authService.decodeAccessToken(accessToken);

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

  async checkPendingUser(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException(ErrorCodes.ERR_01);
    }

    const user = await this.authService.findUserByRefreshToken(refreshToken);

    if (!user) {
      throw new NotFoundException(ErrorCodes.ERR_11);
    }

    if (!user.studio) {
      throw new UnauthorizedException(ErrorCodes.ERR_41);
    }

    if (
      user.role === UserRole.INSTRUCTOR &&
      user.instructor.joinStatus === JoinStatus.PENDING
    ) {
      throw new ForbiddenException(ErrorCodes.ERR_05);
    }

    if (
      user.role === UserRole.MEMBER &&
      user.member.joinStatus === JoinStatus.PENDING
    ) {
      throw new ForbiddenException(ErrorCodes.ERR_05);
    }
  }
}
