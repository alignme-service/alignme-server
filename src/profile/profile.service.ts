import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInstructorDto } from './dto/createInstructor.dto';
import { Profile } from './entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateManagerDto } from './dto/createManager.dto';
import { UserType } from 'src/user/types/userType';
import { User } from 'src/user/entites/user.entity';
import { Auth } from 'src/auth/entites/auth.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Auth)
    private authRepository: Repository<Auth>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  async createInstructor(createInstructor: CreateInstructorDto) {
    // const findProfileUser = await this.profileRepository.findOne({
    //   where: { id: createInstructor.memeberId },
    // });
    // if (!findProfileUser) {
    //   throw new NotFoundException('Not Found Profile User');
    // }
    // const instructorData = {
    //   ...findProfileUser,
    //   userType: UserType.INSTRUCTOR,
    // };
    // return this.profileRepository.save(instructorData);
  }

  async createManager(createManager: CreateManagerDto) {
    const authUser = await this.authRepository.findOne({
      where: { kakaoMemberId: createManager.kakaoMemberId },
      relations: ['user', 'user.profile'],
    });

    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: createManager.kakaoMemberId },
      relations: ['user.profile'],
    });

    console.log('!@#$', user);

    if (!authUser) {
      throw new NotFoundException('Not Found Auth User');
    }

    // User 정보 업데이트
    if (createManager.name) {
      authUser.user.name = createManager.name;
    }
    if (createManager.userType) {
      authUser.user.userType = createManager.userType;
    }
    console.log('!++!!!', authUser);

    // Profile 정보 업데이트
    // let profile = authUser.user.profile;
    let profile = user.profile;

    if (createManager.studioName) {
      profile.studioName = createManager.studioName;
    }
    if (createManager.studioRegioinName) {
      profile.studioRegioinName = createManager.studioRegioinName;
    }
    profile.updatedAt = new Date();

    // 변경사항 저장
    await this.userRepository.save(authUser.user);

    // Profile 변경사항 명시적으로 저장
    if (profile.id) {
      await this.profileRepository.update(profile.id, profile);
    } else {
      await this.profileRepository.save(profile);
    }

    console.log('Updated Auth User:', authUser);

    return authUser.user;
  }

  async updateProfileImage(
    kakaoMemberId: number,
    profileImage: string,
  ): Promise<Profile> {
    // 1. kakaoMemberId로 Auth 엔티티를 찾습니다.
    const auth = await this.authRepository.findOne({
      where: { kakaoMemberId },
      relations: ['user', 'user.profile'],
    });

    let user = auth.user;
    if (!user) {
      // 사용자가 없으면 새로 생성합니다.
      user = this.userRepository.create();
      user = await this.userRepository.save(user);
      auth.user = user;
      await this.authRepository.save(auth);
    }

    let profile = user.profile;
    if (!profile) {
      // Profile이 없으면 새로 생성합니다.
      profile = this.profileRepository.create({
        profile_image: profileImage,
        updatedAt: new Date(),
      });
      profile = await this.profileRepository.save(profile);
      user.profile = profile;
    } else {
      // Profile이 있으면 이미지를 업데이트합니다.
      profile.profile_image = profileImage;
      profile.updatedAt = new Date();
      profile = await this.profileRepository.save(profile);
    }

    // await this.userRepository.save(auth.user);

    return profile;

    // const user = auth.user;
    // console.log('@@', user);

    // let newProfile;

    // // 2. User와 연관된 Profile을 확인합니다.
    // if (!user || user === null) {
    //   // Profile이 없으면 새로 생성합니다.
    //   newProfile = this.profileRepository.create({
    //     profile_image: profileImage,
    //     updatedAt: new Date(),
    //   });
    // } else {
    //   // Profile이 있으면 이미지를 업데이트합니다.
    //   user.profile.profile_image = profileImage;
    // }

    // user.profile = await this.profileRepository.save(newProfile);
    // await this.userRepository.save(user);

    // return user.profile;
  }
}
