import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInstructorDto } from './dto/createInstructor.dto';
import { Profile } from './entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateManagerDto } from './dto/createManager.dto';
import { User } from 'src/user/entites/user.entity';
import { Studio } from '../studio/entites/studio.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(Studio)
    private studioRepository: Repository<Studio>,
  ) {}

  async createInstructor(createInstructor: CreateInstructorDto) {
    const instructor = await this.createUser(createInstructor);

    if (!createInstructor.studioName) {
      throw new NotFoundException('invalid Studio name');
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

    instructor.studio.studioName = createInstructor.studioName;

    await this.studioRepository.save(instructor.studio);

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

    if (!createManager.studioName) {
      throw new NotFoundException('invalid Studio name');
    }

    let profile = manager.profile;

    profile.updatedAt = new Date();

    manager.studio.studioName = createManager.studioName;
    manager.studio.studioRegionName = createManager.studioRegionName;

    await this.studioRepository.save(manager.studio);

    // 변경사항 저장
    await this.userRepository.save(manager);

    return profile;
  }

  private async createUser(
    createUserDto: CreateManagerDto | CreateInstructorDto,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: createUserDto.kakaoMemberId },
      relations: ['profile', 'studio'],
    });

    if (user.profile) {
      throw new NotFoundException('Already joined User');
    }

    const studio = this.studioRepository.create({
      studioName: '',
    });

    user.studio = studio;

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
