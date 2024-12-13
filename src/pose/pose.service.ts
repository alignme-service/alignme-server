import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Pose } from './entities/pose.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PoseService {
  constructor(
    @InjectRepository(Pose)
    private readonly poseRepository: Repository<Pose>,
  ) {}

  async getPoseFromContent(contentId: number) {
    const findPose = await this.poseRepository.findOne({
      where: { content: { id: contentId } },
      relations: ['content'],
    });

    return {
      poseData: JSON.parse(findPose.poseData),
      content: {
        id: findPose.content.id,
        title: findPose.content.title,
        level: findPose.content.level,
        poseImage: findPose.content.imageUrl,
      },
    };
  }
}
