import { Module } from '@nestjs/common';
import { PoseService } from './pose.service';
import { PoseController } from './pose.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from '../content/entites/content.entity';
import { Pose } from './entities/pose.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pose, Content])],
  controllers: [PoseController],
  providers: [PoseService],
})
export class PoseModule {}
