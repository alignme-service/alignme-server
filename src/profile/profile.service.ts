import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInstructorDto } from './dto/createInstructor.dto';
import { Profile } from './entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateManagerDto } from './dto/createManager.dto';
import { User } from 'src/user/entites/user.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  async createInstructor(createInstructor: CreateInstructorDto) {
    const instructor = await this.createUser(createInstructor);

    if (createInstructor.studioName) {
      instructor.studioName = createInstructor.studioName;
    }

    if (createInstructor.name) {
      instructor.nickname = createInstructor.name;
    }

    if (createInstructor.userRole) {
      instructor.role = createInstructor.userRole;
    }

    let profile = instructor.profile;

    profile.updatedAt = new Date();

    // 변경사항 저장
    await this.userRepository.save(instructor);

    return profile;
  }

  async createManager(createManager: CreateManagerDto) {
    const manager = await this.createUser(createManager);

    if (createManager.name) {
      manager.nickname = createManager.name;
    }

    if (createManager.userRole) {
      manager.role = createManager.userRole;
    }

    if (createManager.studioName) {
      manager.studioName = createManager.studioName;
    }
    if (createManager.studioRegionName) {
      manager.studioRegionName = createManager.studioRegionName;
    }

    let profile = manager.profile;

    profile.updatedAt = new Date();

    // 변경사항 저장
    await this.userRepository.save(manager);

    return profile;
  }

  private async createUser(
    createUserDto: CreateManagerDto | CreateInstructorDto,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: createUserDto.kakaoMemberId },
      relations: ['profile'],
    });

    if (user.profile) {
      throw new NotFoundException('Already joined User');
    }

    if (!user.profile) {
      const newProfile = this.profileRepository.create({
        user,
      });
      user.profile = await this.profileRepository.save(newProfile);
    }

    if (!user) {
      throw new NotFoundException('Not Found Auth User');
    }

    return user;
  }
}
