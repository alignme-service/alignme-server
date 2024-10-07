import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Content } from './entites/content.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateContentDto } from './dto/content-dto';
import { AuthService } from '../auth/auth.service';
import { User } from '../user/entites/user.entity';
import { AwsService } from '../aws/aws.service';
import { UtilsService } from '../utils/utils.service';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private authService: AuthService,
    private readonly awsService: AwsService,
    private readonly utilsService: UtilsService,
  ) {}

  async getContents(page: number, limit: number) {
    const queryBuilder = this.contentRepository.createQueryBuilder('content');

    queryBuilder.orderBy('content.createdAt', 'DESC');

    // 필터링 추가시
    // if (level) {
    //   queryBuilder.andWhere('content.level = :level', { level });
    // }

    const [contents, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: contents,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async createContent(
    createContentDto: CreateContentDto,
    accessToken: string,
    file: Express.Multer.File,
  ) {
    const { userId } = this.authService.decodeTokenUserId(accessToken);

    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
      relations: ['instructor'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'instructor') {
      throw new Error('Only instructors can create content');
    }

    const imgSrc = await this.imageUpload(file);

    const updateContent = this.contentRepository.create({
      ...createContentDto,
      imageUrl: imgSrc.imageUrl,
      instructor: user.instructor,
    });

    await this.contentRepository.save(updateContent);

    return updateContent;
  }

  async updateContent(
    contentId: string,
    updateContentDto: Partial<CreateContentDto>,
    accessToken: string,
    file?: Express.Multer.File,
  ) {
    const { userId } = this.authService.decodeTokenUserId(accessToken);
    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
    });

    if (!user || user.role !== 'instructor') {
      throw new UnauthorizedException('Only instructors can update content');
    }

    const content = await this.contentRepository.findOne({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // 이미지 업데이트 처리
    if (file) {
      // 기존 이미지 삭제
      if (content.imageUrl) {
        await this.awsService.deleteFileFromS3(content.imageUrl, 'content');
      }
      const imgSrc = await this.imageUpload(file);
      content.imageUrl = imgSrc.imageUrl;
    }

    // DTO의 필드들로 content 업데이트
    Object.assign(content, updateContentDto);

    await this.contentRepository.save(content);

    return content;
  }

  async deleteContent(contentId: string, accessToken: string) {
    const { userId } = this.authService.decodeTokenUserId(accessToken);
    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
    });

    if (!user || user.role !== 'instructor') {
      throw new UnauthorizedException('Only instructors can delete content');
    }

    const content = await this.contentRepository.findOne({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // 이미지 삭제
    if (content.imageUrl) {
      await this.awsService.deleteFileFromS3(content.imageUrl, 'content');
    }

    await this.contentRepository.remove(content);

    return { message: 'Content successfully deleted' };
  }

  private async imageUpload(file: Express.Multer.File) {
    const imageName = this.utilsService.getUUID();
    const ext = file.originalname.split('.').pop();

    const imageUrl = await this.awsService.imageUploadToS3(
      `${imageName}.${ext}`,
      file,
      ext,
      'content',
    );

    return { imageUrl };
  }
}
