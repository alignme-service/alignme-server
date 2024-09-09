import { Injectable } from '@nestjs/common';
import { CreateInstructorDto } from './dto/CreateInstructor.dto';
import { Profile } from './entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateManagerDto } from './dto/createManager.dto';
import { UserType } from 'src/user/types/userType';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  async createInstructor(createInstructor: CreateInstructorDto) {
    const profile = this.profileRepository.create(createInstructor);

    const instructorData: Profile = {
      ...profile,
      userType: UserType.INSTRUCTOR,
    };

    return this.profileRepository.save(instructorData);
  }

  async createManager(createManager: CreateManagerDto) {
    const profile = this.profileRepository.create(createManager);

    const managerData: Profile = {
      ...profile,
      userType: UserType.MANAGER,
    };

    return this.profileRepository.save(managerData);
  }
}
