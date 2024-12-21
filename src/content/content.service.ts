import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Content } from './entites/content.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateContentDto } from './dto/content-dto';
import { AuthService } from '../auth/auth.service';
import { User } from '../user/entites/user.entity';
import { AwsService } from '../aws/aws.service';
import { UtilsService } from '../utils/utils.service';
import { UserRole } from '../user/types/userRole';
import { Pose } from '../pose/entities/pose.entity';

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
    @InjectRepository(Pose)
    private readonly poseRepository: Repository<Pose>,
  ) {}

  // async getContents(page: number, limit: number, accessToken: string) {
  //   const { userId } = this.authService.decodeTokenUserId(accessToken);
  //
  //   const user = await this.userRepository.findOne({
  //     where: { kakaoMemberId: +userId },
  //     relations: ['instructor', 'member', 'member.instructor'],
  //   });
  //
  //   if (!user) {
  //     throw new NotFoundException('Instructor not found');
  //   }
  //
  //   const queryBuilder = this.contentRepository.createQueryBuilder('content');
  //
  //   const [contents, total] = await queryBuilder
  //     .innerJoin('content.instructor', 'instructor')
  //     .where('instructor.id = :instructorId', {
  //       instructorId: user.instructor.id,
  //     })
  //     .orderBy('content.createdAt', 'DESC')
  //     .skip((page - 1) * limit)
  //     .take(limit)
  //     .getManyAndCount();
  //
  //   const totalPages = Math.ceil(total / limit);
  //
  //   return {
  //     data: contents,
  //     meta: {
  //       total,
  //       page,
  //       limit,
  //       totalPages,
  //     },
  //   };
  // }

  async getContents(
    page: number,
    limit: number,
    accessToken: string,
    instructorIdByMember?: string,
  ) {
    const { userId } = this.authService.decodeAccessToken(accessToken);

    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
      relations: ['instructor', 'member.instructor'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let instructorId;

    if (user.role === UserRole.INSTRUCTOR) {
      instructorId = user.instructor.id;
    } else if (user.role === UserRole.MEMBER) {
      instructorId = instructorIdByMember || user.member.instructor.id;
    } else {
      throw new ForbiddenException(
        'User does not have permission to access contents',
      );
    }

    const queryBuilder = this.contentRepository.createQueryBuilder('content');

    const [contents, total] = await queryBuilder
      .innerJoin('content.instructor', 'instructor')
      .where('instructor.id = :instructorId', { instructorId })
      .orderBy('content.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    const enrichedContents = contents.map((content) => ({
      ...content,
      ...(instructorIdByMember
        ? {}
        : {
            instructor: {
              instructorId:
                user.role === UserRole.INSTRUCTOR
                  ? user.instructor.id
                  : user.member.instructor.id,
              instructorName: user.name,
            },
          }),
    }));

    return {
      data: enrichedContents,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async createContent(
    file: Express.Multer.File,
    createContentDto: CreateContentDto,
    accessToken: string,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    if (
      !createContentDto.title ||
      !createContentDto.level ||
      !createContentDto.description ||
      !createContentDto.poseData.length
    ) {
      throw new BadRequestException(
        'Title, level, description, poseData are required',
      );
    }
    const { userId } = this.authService.decodeAccessToken(accessToken);

    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
      relations: ['instructor'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    const pose = this.poseRepository.create({
      poseData: createContentDto.poseData,
    });
    await this.poseRepository.save(pose);

    const imgSrc = await this.imageUpload(file);

    const updateContent = this.contentRepository.create({
      title: createContentDto.title,
      level: createContentDto.level,
      description: createContentDto.description,
      imageUrl: imgSrc.imageUrl,
      instructor: user.instructor,
      pose,
    });

    await this.contentRepository.save(updateContent);

    return updateContent;
    // return { true: true };
  }

  async updateContent(
    contentId: string,
    updateContentDto: Partial<CreateContentDto>,
    file?: Express.Multer.File,
  ) {
    if (!contentId || !updateContentDto) {
      throw new NotFoundException(
        'ContentId and updateContentDto are required',
      );
    }

    const content = await this.contentRepository.findOne({
      where: { id: +contentId },
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

    content.createdAt = new Date();

    // DTO의 필드들로 content 업데이트
    Object.assign(content, updateContentDto);

    await this.contentRepository.save(content);

    return content.pose;
  }

  async deleteContent(contentId: string, accessToken: string) {
    const { userId } = this.authService.decodeAccessToken(accessToken);
    const user = await this.userRepository.findOne({
      where: { kakaoMemberId: +userId },
    });

    if (!user || user.role !== 'instructor') {
      throw new NotFoundException('Only instructors can delete content');
    }

    const content = await this.contentRepository.findOne({
      where: { id: +contentId },
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

  async getContentById(contentId: string) {
    const content = await this.contentRepository.findOne({
      where: { id: +contentId },
      relations: ['pose'],
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return content;
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
