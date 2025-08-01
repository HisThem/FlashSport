import { Activity, EnrollmentStatus } from '../api/activity';
import userAPI from '../api/user';

/**
 * 为活动添加用户报名状态信息
 * @param activity 活动对象
 * @returns 带有 is_enrolled 和 enrollment_count 字段的活动对象
 */
export function enrichActivityWithEnrollmentStatus(activity: Activity): Activity {
  const currentUser = userAPI.getCurrentUserFromStorage();
  
  // 计算报名人数
  const enrollmentCount = activity.enrollments?.filter(
    (enrollment) => enrollment.status === EnrollmentStatus.ENROLLED
  ).length || 0;
  
  // 检查当前用户是否已报名
  let isEnrolled = false;
  if (currentUser && activity.enrollments) {
    isEnrolled = activity.enrollments.some(
      (enrollment) => 
        enrollment.user_id === currentUser.id && 
        enrollment.status === EnrollmentStatus.ENROLLED
    );
  }
  
  return {
    ...activity,
    enrollment_count: enrollmentCount,
    is_enrolled: isEnrolled
  };
}

/**
 * 为活动列表批量添加用户报名状态信息
 * @param activities 活动列表
 * @returns 带有报名状态信息的活动列表
 */
export function enrichActivitiesWithEnrollmentStatus(activities: Activity[]): Activity[] {
  return activities.map(activity => enrichActivityWithEnrollmentStatus(activity));
}

/**
 * 检查用户是否可以报名某个活动
 * @param activity 活动对象
 * @returns 是否可以报名
 */
export function canUserEnroll(activity: Activity): boolean {
  const currentUser = userAPI.getCurrentUserFromStorage();
  
  if (!currentUser) {
    return false;
  }
  
  // 确保活动有报名状态信息
  const enrichedActivity = enrichActivityWithEnrollmentStatus(activity);
  
  return (
    enrichedActivity.status === 'recruiting' &&
    !isRegistrationExpired(enrichedActivity.registration_deadline) &&
    (enrichedActivity.enrollment_count || 0) < enrichedActivity.max_participants &&
    !(enrichedActivity.is_enrolled || false)
  );
}

/**
 * 检查用户是否可以取消报名某个活动
 * @param activity 活动对象
 * @returns 是否可以取消报名
 */
export function canUserCancelEnrollment(activity: Activity): boolean {
  const currentUser = userAPI.getCurrentUserFromStorage();
  
  if (!currentUser) {
    return false;
  }
  
  // 确保活动有报名状态信息
  const enrichedActivity = enrichActivityWithEnrollmentStatus(activity);
  
  return (
    (enrichedActivity.is_enrolled || false) &&
    enrichedActivity.status === 'recruiting' &&
    !isRegistrationExpired(enrichedActivity.registration_deadline)
  );
}

/**
 * 检查报名是否已经截止
 * @param registrationDeadline 报名截止时间
 * @returns 是否已截止
 */
export function isRegistrationExpired(registrationDeadline: string): boolean {
  return new Date(registrationDeadline) <= new Date();
}
