import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
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

    return {
      instructorId: createdInstructor.id,
    };
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

    return {
      managerId: createdManager.id,
    };
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

    if (user.role !== UserRole.MANAGER) {
      throw new NotFoundException('Invalid user role');
    }

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

    const managers = await this.managerRepository.findOne({
      where: { user: { studio: { id: user.studio.id } } },
      relations: ['user', 'user.profile'],
    });

    const instructorList = instructors.map((instructor) => ({
      id: instructor.id,
      kakaoMemberId: instructor.user.kakaoMemberId,
      name: instructor.user.name,
      createdAt: instructor.user.createdAt,
      profileImage: instructor.user.profile?.profile_image || null,
    }));

    const managerList = {
      id: managers.id,
      kakaoMemberId: managers.user.kakaoMemberId,
      name: managers.user.name,
      createdAt: managers.user.createdAt,
      profileImage: managers.user.profile?.profile_image || null,
    };

    instructorList.push(managerList);

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
    const { userId } = this.authService.decodeTokenUserId(accessToken);

    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
      relations: ['studio', 'instructor'],
    });

    if (user.role !== UserRole.MANAGER) {
      throw new NotFoundException('Invalid user role');
    }

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

  // async getMembers(page: number = 1, limit: number = 5, accessToken: string) {
  //   // Todo: 매니저만 접근 가능하도록 롤 체크 필요
  //
  //   const { userId } = this.authService.decodeTokenUserId(accessToken);
  //
  //   const user = await this.userRepository.findOne({
  //     where: { kakaoMemberId: +userId },
  //     relations: ['instructor', 'manager'],
  //   });
  //
  //   if (user.role === UserRole.MANAGER) {
  //     const manager = await this.managerRepository.findOne({
  //       where: { id: user.manager.id },
  //       relations: ['members', 'members.user', 'user'],
  //     });
  //
  //     if (!manager) {
  //       throw new NotFoundException('해당 매니저를 찾을 수 없습니다.');
  //     }
  //
  //     const [members, total] = await this.memberRepository.findAndCount({
  //       where: { manager: { id: user.manager.id } },
  //       relations: ['user', 'user.profile', 'user.member'],
  //       take: limit,
  //       skip: (page - 1) * limit,
  //       order: { id: 'ASC' }, // ID 기준으로 정렬, 필요에 따라 변경 가능
  //     });
  //
  //     const users = members.map((member) => member.user);
  //
  //     return {
  //       data: {
  //         users: users.map((user) => ({
  //           id: user.member.id,
  //           name: user.name,
  //           createdAt: user.createdAt,
  //           profileImage: user.profile?.profile_image || null,
  //           manager: {
  //             id: manager.id,
  //             name: manager.user.name,
  //           },
  //         })),
  //       },
  //       meta: {
  //         total,
  //         page,
  //         limit,
  //         totalPages: Math.ceil(total / limit),
  //       },
  //     };
  //   }
  //
  //   // 강사일때 강사 소속 회원 목록 조회
  //   const instructor = await this.instructorRepository.findOne({
  //     where: { id: user.instructor.id },
  //     relations: ['members', 'members.user', 'user'],
  //   });
  //
  //   if (!instructor) {
  //     throw new NotFoundException('해당 강사를 찾을 수 없습니다.');
  //   }
  //
  //   const [members, total] = await this.memberRepository.findAndCount({
  //     where: { instructor: { id: user.instructor.id } },
  //     relations: ['user', 'user.profile', 'user.member'],
  //     take: limit,
  //     skip: (page - 1) * limit,
  //     order: { id: 'ASC' }, // ID 기준으로 정렬, 필요에 따라 변경 가능
  //   });
  //
  //   const users = members.map((member) => member.user);
  //
  //   return {
  //     data: {
  //       users: users.map((user) => ({
  //         id: user.member.id,
  //         name: user.name,
  //         createdAt: user.createdAt,
  //         profileImage: user.profile?.profile_image || null,
  //         instructor: {
  //           id: instructor.id,
  //           name: instructor.user.name,
  //         },
  //       })),
  //     },
  //     meta: {
  //       total,
  //       page,
  //       limit,
  //       totalPages: Math.ceil(total / limit),
  //     },
  //   };
  // }

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

    if (user.role !== UserRole.MANAGER) {
      throw new NotFoundException('Invalid user role');
    }

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.studio', 'studio')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.studioId = :studioId', { studioId: user.studio.id });

    if (type === UserRole.INSTRUCTOR.toUpperCase()) {
      queryBuilder
        .leftJoinAndSelect('user.instructor', 'instructor')
        .andWhere('instructor.joinStatus = :status', { status: 'pending' });
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
      relations: ['member', 'member.instructor'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Todo: manager로 변환하기
    if (user.role !== UserRole.MANAGER) {
      throw new NotFoundException('Invalid user role');
    }

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

  async leaveUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.authService.leaveUser(userId);
  }

  // 유저 가입 요청 승인
  async approveJoinRequest(
    userId: string,
    isApprove: JoinStatus,
    accessToken: string,
  ) {
    const { userId: adminId } = this.authService.decodeTokenUserId(accessToken);

    // 승인/거절 제어 할 매니저/강사 찾기
    const admin = await this.userRepository.findOne({
      where: { kakaoMemberId: +adminId },
    });

    if (admin.role !== UserRole.MANAGER) {
      throw new NotFoundException('Invalid user role');
    }

    // 승인/거절 대상의 user 찾기
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 가입 거절
    if (isApprove === JoinStatus.REJECTED) {
      if (admin.role === UserRole.MANAGER) {
        await this.instructorRepository.delete({ user });
      } else if (admin.role === UserRole.INSTRUCTOR) {
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
