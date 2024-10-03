import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

  async createMember(accessToken: string, createMemberDto: CreateMemberDto) {
    if (!createMemberDto.studioName) {
      throw new NotFoundException('invalid Studio name');
    }

    const member = await this.findUser(accessToken);

    if (createMemberDto.name) {
      member.name = createMemberDto.name;
    }

    member.role = UserRole.MEMEBER;

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
}
