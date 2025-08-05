import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { Enrollment } from './enrollment.entity';
import { Comment } from './comment.entity';
import { ActivityImage } from './activity-image.entity';

export enum ActivityStatus {
  PREPARING = 'preparing',
  RECRUITING = 'recruiting',
  REGISTRATION_CLOSED = 'registration_closed',
  ONGOING = 'ongoing',
  FINISHED = 'finished',
  CANCELLED = 'cancelled',
}

export enum FeeType {
  FREE = 'free',
  AA = 'aa',
  PREPAID_ALL = 'prepaid_all',
  PREPAID_REFUNDABLE = 'prepaid_refundable',
}

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ nullable: true })
  cover_image_url?: string;

  @Column()
  location: string;

  @Column('datetime')
  start_time: Date;

  @Column('datetime')
  end_time: Date;

  @Column('datetime')
  registration_deadline: Date;

  @Column()
  max_participants: number;

  @Column({
    type: 'varchar',
    enum: ActivityStatus,
    default: ActivityStatus.PREPARING,
  })
  status: ActivityStatus;

  @Column({
    type: 'varchar',
    enum: FeeType,
    default: FeeType.FREE,
  })
  fee_type: FeeType;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  fee_amount: number;

  @Column()
  organizer_id: number;

  @Column()
  category_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // 关联关系
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;

  @ManyToOne(() => Category, (category) => category.activities, { eager: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.activity)
  enrollments: Enrollment[];

  @OneToMany(() => Comment, (comment) => comment.activity)
  comments: Comment[];

  @OneToMany(() => ActivityImage, (image) => image.activity)
  images: ActivityImage[];
}
