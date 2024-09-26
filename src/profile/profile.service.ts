import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInstructorDto } from './dto/createInstructor.dto';
import { Profile } from './entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateManagerDto } from './dto/createManager.dto';
import { User } from 'src/user/entites/user.entity';
import { Studio } from '../studio/entites/studio.entity';
import { UtilsService } from '../utils/utils.service';
import { AwsService } from '../aws/aws.service';
import { Instructor } from '../user/entites/instructor.entity';
import { Manager } from '../user/entites/manager.entity';
import { Auth } from '../auth/entites/auth.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Auth)
    private authRepository: Repository<Auth>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Instructor)
    private instructorRepository: Repository<Instructor>,
    @InjectRepository(Manager)
    private managerRepository: Repository<Manager>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(Studio)
    private studioRepository: Repository<Studio>,
    private readonly utilsService: UtilsService,
    private readonly awsService: AwsService,
  ) {}

  // async test() {
  //   const instructor = await this.instructorRepository.findOne({
  //     // where: { kakaoMemberId: 3691135653 },
  //     relations: ['user', 'instructor'],
  //   });
  //
  //   const member = {
  //     kakaoMemberId: 1234,
  //     email: 'teset',
  //     nickname: 'asdf',
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //     role: UserRole.MEMEBER,
  //   };
  // }

  async createInstructor(createInstructor: CreateInstructorDto) {
    if (!createInstructor.studioName) {
      throw new NotFoundException('invalid Studio name');
    }

    const instructor = await this.createUser(createInstructor);

    if (createInstructor.name) {
      instructor.name = createInstructor.name;
    }

    if (createInstructor.userRole) {
      instructor.role = createInstructor.userRole;
    }

    if (createInstructor.studioName) {
      instructor.studio.studioName = createInstructor.studioName;
    }

    await this.studioRepository.save(instructor.studio);

    await this.userRepository.save(instructor);

    const createdInstructor = this.instructorRepository.create({
      user: instructor,
    });

    await this.instructorRepository.save(createdInstructor);

    return createdInstructor;
  }

  async createManager(createManager: CreateManagerDto) {
    if (!createManager.studioName) {
      throw new NotFoundException('invalid Studio name');
    }

    const manager = await this.createUser(createManager);

    if (createManager.name) {
      manager.name = createManager.name;
    }

    if (createManager.userRole) {
      manager.role = createManager.userRole;
    }

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

  async getMypageInfo(userId: number) {
    const userInfo = await this.userRepository.findOne({
      where: { kakaoMemberId: userId },
      relations: ['profile', 'studio'],
    });

    const profile = userInfo.profile;
    const studio = userInfo.studio;

    return {
      profile_image: profile.profile_image,
      email: userInfo.email,
      studio: studio.studioName,
      studioRegion: studio.studioRegionName || null,
      name: userInfo.name,
      role: userInfo.role,
    };
  }

  async saveImage(kakaoMemberId: number, file: Express.Multer.File) {
    const imgSrc = await this.imageUpload(file);

    const findUser = await this.userRepository.findOne({
      where: { kakaoMemberId },
      relations: ['profile'],
    });

    findUser.profile.profile_image = imgSrc.imageUrl;
    await this.profileRepository.save(findUser.profile);
  }

  private async imageUpload(file: Express.Multer.File) {
    const imageName = this.utilsService.getUUID();
    const ext = file.originalname.split('.').pop();

    const imageUrl = await this.awsService.imageUploadToS3(
      `${imageName}.${ext}`,
      file,
      ext,
      'profile',
    );

    return { imageUrl };
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
}
