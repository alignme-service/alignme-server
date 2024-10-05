import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { Instructor } from './entites/instructor.entity';
import { AuthService } from '../auth/auth.service';
import { User } from './entites/user.entity';
import { UserRole } from './types/userRole';
import { Manager } from './entites/manager.entity';
import { Studio } from '../studio/entites/studio.entity';
import { BaseCreateUserDto } from './dto/baseCreateUser.dto';
import { CreateManagerDto } from './dto/createManager.dto';
import { CreateMemberDto } from './dto/createMember.dto';
import { Profile } from '../profile/entities/profile.entity';
import { Member } from './entites/member.entity';
import { JoinStatus } from './constant/join-status.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Manager)
    private managerRepository: Repository<Manager>,
    @InjectRepository(Studio)
    private studioRepository: Repository<Studio>,
    @InjectRepository(Instructor)
    private instructorRepository: Repository<Instructor>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private authService: AuthService,
    private dataSource: DataSource,
  ) {}

  async createMember(accessToken: string, createMemberDto: CreateMemberDto) {
    if (!createMemberDto.studioName) {
      throw new NotFoundException('invalid Studio name');
    }

    const member = await this.findUser(accessToken);

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

    // member.instructor = findInstructor;

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

    return createdMember;
  }

  async createInstructor(
    accessToken: string,
    createInstructor: BaseCreateUserDto,
  ) {
    if (!createInstructor.studioName) {
      throw new NotFoundException('invalid Studio name');
    }

    const instructor = await this.findUser(accessToken);

    if (createInstructor.name) {
      instructor.name = createInstructor.name;
    }

    instructor.role = UserRole.INSTRUCTOR;

    if (createInstructor.studioName) {
      instructor.studio.studioName = createInstructor.studioName;
    }

    await this.studioRepository.save(instructor.studio);

    // try {
    //   const studio = await this.studioRepository.findOne({
    //     where: { studioName: createInstructor.studioName },
    //   });
    //   instructor.studio = studio;
    // } catch {
    //   throw new NotFoundException('Not Found Studio');
    // }

    await this.userRepository.save(instructor);

    const createdInstructor = this.instructorRepository.create({
      user: instructor,
    });

    createdInstructor.joinStatus = JoinStatus.PENDING;

    await this.instructorRepository.save(createdInstructor);

    return createdInstructor;
  }

  async createManager(accessToken: string, createManager: CreateManagerDto) {
    if (!createManager.studioName) {
      throw new NotFoundException('invalid Studio name');
    }

    const manager = await this.findUser(accessToken);

    if (createManager.name) {
      manager.name = createManager.name;
    }

    manager.role = UserRole.MANAGER;

    if (createManager.studioName) {
      manager.studio.studioName = createManager.studioName;
    }

    if (createManager.studioRegionName) {
      manager.studio.studioRegionName = createManager.studioRegionName;
    }

    await this.studioRepository.save(manager.studio);

    await this.userRepository.save(manager);

    const createdManager = this.managerRepository.create({
      user: manager,
    });

    await this.managerRepository.save(createdManager);

    return createdManager;
  }

  private async findUser(accessToken: string): Promise<User> {
    const { userId } = this.authService.decodeTokenUserId(accessToken);

    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
      relations: ['profile', 'studio'],
    });

    if (user.profile) {
      throw new NotFoundException('Already joined User');
    }

    const studio = this.studioRepository.create();

    user.studio = studio;

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

    return user;
  }

  async getInstructors(page: number = 1, limit: number = 10) {
    const [instructors, total] = await this.instructorRepository.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { id: 'ASC' }, // ID 기준으로 정렬, 필요에 따라 변경 가능
      relations: ['user'], // 강사와 연결된 사용자 정보도 가져옵니다.
    });

    return {
      data: instructors,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMembersFromInstructor(
    instructorId: string,
    page: number = 1,
    limit: number = 5,
  ) {
    const instructor = await this.instructorRepository.findOne({
      where: { id: instructorId },
      relations: ['members', 'members.user'],
    });

    if (!instructor) {
      throw new NotFoundException('해당 강사를 찾을 수 없습니다.');
    }

    const [members, total] = await this.memberRepository.findAndCount({
      where: { instructor: { id: instructorId } },
      relations: ['user'],
      take: limit,
      skip: (page - 1) * limit,
      order: { id: 'ASC' }, // ID 기준으로 정렬, 필요에 따라 변경 가능
    });

    const users = members.map((member) => member.user);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 유저 가입 요청 목록 조회
  async getJoinRequests(page: number = 1, limit: number = 10) {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    const [pendingUsers, total] = await queryBuilder
      .leftJoinAndSelect('user.instructor', 'instructor')
      .leftJoinAndSelect('user.member', 'member')
      .where(
        new Brackets((qb) => {
          qb.where("instructor.joinStatus = 'pending'").orWhere(
            "member.joinStatus = 'pending'",
          );
        }),
      )
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const formattedUsers = pendingUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      instructor: user.instructor
        ? {
            id: user.instructor.id,
            isJoined: user.instructor.joinStatus,
            // 필요한 기타 instructor 정보
          }
        : null,
      member: user.member
        ? {
            id: user.member.id,
            isJoined: user.member.joinStatus,
            // 필요한 기타 member 정보
          }
        : null,
    }));

    return {
      data: formattedUsers,
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
      relations: ['member', 'member.instructor'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Todo: manager로 변환하기
    if (user.role !== UserRole.INSTRUCTOR) {
      throw new BadRequestException(
        'Invalid user role for changing instructor',
      );
    }

    const old_instructor = await this.instructorRepository.findOne({
      where: { members: { id: memberId } },
      relations: ['members'],
    });

    const instructor = await this.instructorRepository.findOne({
      where: { id: instructorId },
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

    // 이전 강사와의 관계 제거
    member.instructor = instructor;
    await this.memberRepository.save(member);

    // Todo: instructor의 member 제거

    return user.member;
  }

  async leaveUser(accessToken: string) {
    const { userId } = this.authService.decodeTokenUserId(accessToken);

    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.authService.leaveUser(userId);
  }

  // 유저 가입 요청 승인
  async approveJoinRequest(accessToken: string, isApprove: JoinStatus) {
    const { userId } = this.authService.decodeTokenUserId(accessToken);

    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 가입 거절
    if (isApprove === JoinStatus.REJECTED) {
      if (user.role === UserRole.INSTRUCTOR) {
        await this.instructorRepository.delete({ user });
      } else if (user.role === UserRole.MEMBER) {
        await this.memberRepository.delete({ user });
      } else {
        throw new BadRequestException('Invalid user role for approval');
      }
      await this.authService.leaveUser(userId);
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

  private async approveInstructorOrMember(
    user: User,
    role: Exclude<UserRole, 'manager'>,
  ) {
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
}
