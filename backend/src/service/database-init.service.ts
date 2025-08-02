import { Injectable, OnModuleInit } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { UserService } from './user.service';
import { ActivityStatus, FeeType } from '../entities/activity.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class DatabaseInitService implements OnModuleInit {
  constructor(
    private readonly activityService: ActivityService,
    private readonly userService: UserService,
  ) {}

  async onModuleInit() {
    await this.activityService.initializeCategories();
    await this.initializeSampleData();
  }

  async initializeSampleData() {
    try {
      // 检查是否已有活动数据
      const existingActivities = await this.activityService.getActivities({
        page: 1,
        limit: 1,
      });
      if (existingActivities.total > 0) {
        console.log('已有活动数据存在，跳过初始化');
        console.log('如需使用新的图片数据，请手动清理数据库后重启应用');
        return;
      }

      // 创建示例用户（如果不存在）
      let sampleUser: User;
      try {
        sampleUser = await this.userService.register({
          username: 'demo_user',
          email: 'demo@example.com',
          password: 'password123',
        });
      } catch {
        // 用户可能已存在，尝试通过ID查找
        try {
          sampleUser = await this.userService.findById(1);
        } catch {
          // 如果找不到用户，创建一个新用户
          sampleUser = await this.userService.register({
            username: `demo_user_${Date.now()}`,
            email: `demo_${Date.now()}@example.com`,
            password: 'password123',
          });
        }
      }

      // 创建示例活动
      const sampleActivities = [
        {
          name: '周末篮球友谊赛',
          description: '每周六下午的篮球友谊赛，欢迎各个水平的朋友参加！',
          cover_image_url:
            'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          location: '市体育中心篮球场',
          start_time: new Date(
            Date.now() + 2 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 2天后
          end_time: new Date(
            Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
          ).toISOString(), // 2天后+2小时
          registration_deadline: new Date(
            Date.now() + 24 * 60 * 60 * 1000,
          ).toISOString(), // 1天后
          max_participants: 20,
          status: ActivityStatus.RECRUITING,
          fee_type: FeeType.FREE,
          fee_amount: 0,
          category_id: 4, // 篮球
          image_urls: [
            'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1519766304817-4f37bda74a26?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          ],
        },
        {
          name: '健身房团练',
          description: '专业教练指导的健身团练课程，适合初学者和进阶者。',
          cover_image_url:
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          location: '金牌健身俱乐部',
          start_time: new Date(
            Date.now() + 3 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          end_time: new Date(
            Date.now() + 3 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000,
          ).toISOString(),
          registration_deadline: new Date(
            Date.now() + 2 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          max_participants: 15,
          status: ActivityStatus.RECRUITING,
          fee_type: FeeType.AA,
          fee_amount: 50,
          category_id: 2, // 健身
          image_urls: [
            'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1583500178690-f7fd99582a77?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          ],
        },
        {
          name: '晨练乒乓球',
          description: '早晨乒乓球练习，锻炼身体，结交朋友。',
          cover_image_url:
            'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          location: '社区活动中心',
          start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(
            Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
          ).toISOString(),
          registration_deadline: new Date(
            Date.now() + 0.5 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          max_participants: 8,
          status: ActivityStatus.RECRUITING,
          fee_type: FeeType.FREE,
          fee_amount: 0,
          category_id: 3, // 乒乓球
          image_urls: [
            'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          ],
        },
        {
          name: '足球周末联赛',
          description: '业余足球联赛，比赛激烈，友谊第一！',
          cover_image_url:
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          location: '大学城足球场',
          start_time: new Date(
            Date.now() + 5 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          end_time: new Date(
            Date.now() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
          ).toISOString(),
          registration_deadline: new Date(
            Date.now() + 4 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          max_participants: 22,
          status: ActivityStatus.RECRUITING,
          fee_type: FeeType.AA,
          fee_amount: 30,
          category_id: 5, // 足球
          image_urls: [
            'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1459865264687-595d652de67e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          ],
        },
      ];

      for (const activity of sampleActivities) {
        await this.activityService.createActivity(sampleUser.id, activity);
      }

      console.log('示例活动数据初始化完成');
    } catch (error) {
      console.error('初始化示例数据失败:', error);
    }
  }
}
