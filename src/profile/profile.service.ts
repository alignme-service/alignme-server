import { Injectable } from '@nestjs/common';
import { Profile } from './entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entites/user.entity';
import { UtilsService } from '../utils/utils.service';
import { AwsService } from '../aws/aws.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private readonly utilsService: UtilsService,
    private readonly awsService: AwsService,
    private readonly authService: AuthService,
  ) {}

  async getMypageInfo(accessToken: string) {
    const extractUserInfo = this.authService.decodeAccessToken(accessToken);
    const userId = extractUserInfo.userId;

    const userInfo = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
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

  async updateProfile(
    accessToken: string,
    userName?: string,
    file?: Express.Multer.File,
  ) {
    const extractUserInfo = this.authService.decodeAccessToken(accessToken);
    const userId = extractUserInfo.userId;

    if (file) {
      const findUser = await this.userRepository.findOne({
        where: { kakaoMemberId: +userId },
        relations: ['profile'],
      });
      const imgSrc = await this.imageUpload(file);

      findUser.profile.profile_image = imgSrc.imageUrl;
      await this.profileRepository.save(findUser.profile);
    }

    if (userName) {
      const user = await this.userRepository.findOne({
        where: { kakaoMemberId: +userId },
      });

      user.name = userName;
      await this.userRepository.save(user);
    }

    return { message: 'Profile image successfully updated' };
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
}
