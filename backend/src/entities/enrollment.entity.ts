import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Activity } from './activity.entity';

export enum EnrollmentStatus {
  ENROLLED = 'enrolled',
  CANCELLED = 'cancelled',
}

@Entity('enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  activity_id: number;

  @Column()
  user_id: number;

  @Column({
    type: 'varchar',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.ENROLLED,
  })
  status: EnrollmentStatus;

  @CreateDateColumn()
  enroll_time: Date;

  // 关联关系
  @ManyToOne(() => Activity, (activity) => activity.enrollments)
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
