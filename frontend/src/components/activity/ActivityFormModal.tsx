import React, { useState, useEffect } from 'react';
import { Activity, CreateActivityRequest, UpdateActivityRequest, Category, FeeType, ActivityStatus } from '../../api/activity';
import activityAPI from '../../api/activity';
import { validateRequired, validateNumber } from '../../utils/validation';
import { PROVINCES, DEFAULT_PROVINCE, DEFAULT_CITY, getCitiesByProvince } from '../../utils/chinaRegions';

interface ActivityFormModalProps {
  isOpen: boolean;
  activity?: Activity | null; // 如果有值则为编辑模式，否则为创建模式
  isAdminMode?: boolean; // 是否为管理员模式
  onClose: () => void;
  onSuccess: () => void;
}

const ActivityFormModal: React.FC<ActivityFormModalProps> = ({
  isOpen,
  activity,
  isAdminMode = false,
  onClose,
  onSuccess
}) => {
  type PreviewStatus = 'idle' | 'loading' | 'loaded' | 'error';

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [coverPreviewStatus, setCoverPreviewStatus] = useState<PreviewStatus>('idle');
  const [imagePreviewStatus, setImagePreviewStatus] = useState<Record<number, PreviewStatus>>({});
  const [availableCities, setAvailableCities] = useState<string[]>(() => getCitiesByProvince(DEFAULT_PROVINCE));
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cover_image_url: '',
    province: DEFAULT_PROVINCE,
    city: DEFAULT_CITY,
    address: '',
    start_time: '',
    end_time: '',
    registration_deadline: '',
    max_participants: 10,
    fee_type: FeeType.FREE,
    fee_amount: 0,
    category_id: 0,
    status: ActivityStatus.RECRUITING,
    images: [] as string[]
  });

  const isEditMode = !!activity;
  const isRegistrationExpired = activity && new Date() > new Date(activity.registration_deadline);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      if (activity) {
        // 编辑模式：填充表单数据
        const province = activity.province || DEFAULT_PROVINCE;
        const cities = getCitiesByProvince(province);
        setAvailableCities(cities);
        setFormData({
          name: activity.name,
          description: activity.description,
          cover_image_url: activity.cover_image_url || '',
          province,
          city: activity.city || cities[0] || DEFAULT_CITY,
          address: activity.address || '',
          start_time: activity.start_time.slice(0, 16), // 转换为 datetime-local 格式
          end_time: activity.end_time.slice(0, 16),
          registration_deadline: activity.registration_deadline.slice(0, 16),
          max_participants: activity.max_participants,
          fee_type: activity.fee_type,
          fee_amount: activity.fee_amount,
          category_id: activity.category_id,
          status: activity.status,
          images: activity.images?.map(img => img.image_url) || []
        });
      } else {
        // 创建模式：重置表单
        resetForm();
      }
    }
  }, [isOpen, activity]);

  const loadCategories = async () => {
    try {
      const categoriesData = await activityAPI.getCategories();
      setCategories(categoriesData);
      if (categoriesData.length > 0 && !activity) {
        setFormData(prev => ({ ...prev, category_id: categoriesData[0].id }));
      }
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const resetForm = () => {
    const cities = getCitiesByProvince(DEFAULT_PROVINCE);
    setAvailableCities(cities);
    setFormData({
      name: '',
      description: '',
      cover_image_url: '',
      province: DEFAULT_PROVINCE,
      city: cities[0] || DEFAULT_CITY,
      address: '',
      start_time: '',
      end_time: '',
      registration_deadline: '',
      max_participants: 10,
      fee_type: FeeType.FREE,
      fee_amount: 0,
      category_id: categories.length > 0 ? categories[0].id : 0,
      status: ActivityStatus.RECRUITING,
      images: []
    });
    setErrors({});
    setCoverPreviewStatus('idle');
    setImagePreviewStatus({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'province') {
      const cities = getCitiesByProvince(value);
      setAvailableCities(cities);
      setFormData(prev => ({
        ...prev,
        province: value,
        city: cities.includes(prev.city) ? prev.city : cities[0] || '',
      }));

      if (errors.city) {
        setErrors(prev => ({ ...prev, city: '' }));
      }
      setErrors(prev => ({ ...prev, province: '' }));
      return;
    }

    if (name === 'city') {
      setFormData(prev => ({ ...prev, city: value }));
      if (errors.city) {
        setErrors(prev => ({ ...prev, city: '' }));
      }
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === 'max_participants' || name === 'fee_amount' || name === 'category_id' 
        ? Number(value) 
        : value
    }));
    
    if (name === 'cover_image_url') {
      setCoverPreviewStatus(value ? 'loading' : 'idle');
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addImage = () => {
    const url = prompt('请输入图片URL:');
    if (url && url.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url.trim()]
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreviewStatus(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  useEffect(() => {
    const url = formData.cover_image_url;
    if (!url) {
      setCoverPreviewStatus('idle');
      return;
    }

    setCoverPreviewStatus('loading');
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setCoverPreviewStatus('loaded');
    };
    img.onerror = () => {
      if (!cancelled) setCoverPreviewStatus('error');
    };
    img.src = url;

    return () => {
      cancelled = true;
    };
  }, [formData.cover_image_url]);

  useEffect(() => {
    const initialStatus: Record<number, PreviewStatus> = {};
    const controllers: Array<() => void> = [];

    formData.images.forEach((url, idx) => {
      if (!url) {
        initialStatus[idx] = 'idle';
        return;
      }

      initialStatus[idx] = 'loading';
      let cancelled = false;
      const img = new Image();
      img.onload = () => {
        if (!cancelled) setImagePreviewStatus(prev => ({ ...prev, [idx]: 'loaded' }));
      };
      img.onerror = () => {
        if (!cancelled) setImagePreviewStatus(prev => ({ ...prev, [idx]: 'error' }));
      };
      img.src = url;
      controllers.push(() => { cancelled = true; });
    });

    setImagePreviewStatus(initialStatus);

    return () => {
      controllers.forEach(stop => stop());
    };
  }, [formData.images]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 基础验证
    if (!validateRequired(formData.name)) {
      newErrors.name = '活动名称不能为空';
    }
    if (!validateRequired(formData.description)) {
      newErrors.description = '活动描述不能为空';
    }
    if (!validateRequired(formData.province)) {
      newErrors.province = '请选择省份';
    }
    if (!validateRequired(formData.city)) {
      newErrors.city = '请选择城市';
    }
    if (!validateRequired(formData.address)) {
      newErrors.address = '详细地址不能为空';
    }
    if (!validateRequired(formData.start_time)) {
      newErrors.start_time = '开始时间不能为空';
    }
    if (!validateRequired(formData.end_time)) {
      newErrors.end_time = '结束时间不能为空';
    }
    if (!validateRequired(formData.registration_deadline)) {
      newErrors.registration_deadline = '报名截止时间不能为空';
    }

    // 数字验证
    if (!validateNumber(formData.max_participants, 1)) {
      newErrors.max_participants = '最大参与人数必须大于0';
    }
    if (formData.fee_type !== FeeType.FREE && !validateNumber(formData.fee_amount, 0)) {
      newErrors.fee_amount = '费用金额不能为负数';
    }

    // 时间逻辑验证
    const startTime = new Date(formData.start_time);
    const endTime = new Date(formData.end_time);
    const regDeadline = new Date(formData.registration_deadline);

    if (startTime >= endTime) {
      newErrors.end_time = '结束时间必须晚于开始时间';
    }
    if (regDeadline >= startTime) {
      newErrors.registration_deadline = '报名截止时间必须早于活动开始时间';
    }

    // 分类验证
    if (formData.category_id === 0) {
      newErrors.category_id = '请选择活动分类';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (isEditMode && activity) {
        // 编辑模式
        const updateData: UpdateActivityRequest = {
          name: formData.name,
          description: formData.description,
          cover_image_url: formData.cover_image_url || undefined,
          province: formData.province,
          city: formData.city,
          address: formData.address,
          start_time: formData.start_time,
          end_time: formData.end_time,
          registration_deadline: formData.registration_deadline,
          max_participants: formData.max_participants,
          fee_type: formData.fee_type,
          fee_amount: formData.fee_amount,
          category_id: formData.category_id,
          status: formData.status,
          image_urls: formData.images
        };
        if (isAdminMode) {
          await activityAPI.updateActivityAsAdmin(activity.id, updateData);
        } else {
          await activityAPI.updateActivity(activity.id, updateData);
        }
      } else {
        // 创建模式
        const createData: CreateActivityRequest = {
          name: formData.name,
          description: formData.description,
          cover_image_url: formData.cover_image_url || undefined,
          province: formData.province,
          city: formData.city,
          address: formData.address,
          start_time: formData.start_time,
          end_time: formData.end_time,
          registration_deadline: formData.registration_deadline,
          max_participants: formData.max_participants,
          fee_type: formData.fee_type,
          fee_amount: formData.fee_amount,
          category_id: formData.category_id,
          image_urls: formData.images
        };
        await activityAPI.createActivity(createData);
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('保存活动失败:', error);
      // 可以添加 Toast 提示
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setTimeout(() => {
        resetForm();
      }, 300);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open pt-20">
      <div className="modal-box relative w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
        <button 
          className="btn btn-sm btn-circle btn-ghost absolute top-4 right-4 z-10"
          onClick={handleClose}
          disabled={loading}
        >
          ✕
        </button>
        <h3 className="font-bold text-lg mb-6">
          {isEditMode ? '编辑活动' : '发布新活动'}
        </h3>
        
        {/* 报名截止时间警告 */}
        {isEditMode && isRegistrationExpired && (
          <div className="alert alert-warning mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>
              <strong>注意：</strong>该活动报名时间已截止，无法修改活动内容。
            </span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">{/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">
                <span className="label-text">活动名称 *</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                placeholder="请输入活动名称"
              />
              {errors.name && <div className="text-error text-sm mt-1">{errors.name}</div>}
            </div>

            <div>
              <label className="label">
                <span className="label-text">活动分类 *</span>
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className={`select select-bordered w-full ${errors.category_id ? 'select-error' : ''}`}
              >
                <option value={0}>请选择分类</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <div className="text-error text-sm mt-1">{errors.category_id}</div>}
            </div>

            <div>
              <label className="label">
                <span className="label-text">省份 *</span>
              </label>
              <select
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                className={`select select-bordered w-full ${errors.province ? 'select-error' : ''}`}
              >
                {PROVINCES.map((province) => (
                  <option key={province.name} value={province.name}>
                    {province.name}
                  </option>
                ))}
              </select>
              {errors.province && <div className="text-error text-sm mt-1">{errors.province}</div>}
            </div>

            <div>
              <label className="label">
                <span className="label-text">城市 *</span>
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className={`select select-bordered w-full ${errors.city ? 'select-error' : ''}`}
              >
                <option value="" disabled>
                  请选择城市
                </option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {errors.city && <div className="text-error text-sm mt-1">{errors.city}</div>}
            </div>

            <div>
              <label className="label">
                <span className="label-text">详细地址 *</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors.address ? 'input-error' : ''}`}
                placeholder="请输入街道、社区或详细地点"
              />
              {errors.address && <div className="text-error text-sm mt-1">{errors.address}</div>}
            </div>
          </div>

          {/* 活动描述 */}
          <div>
            <label className="label">
              <span className="label-text">活动描述 *</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`textarea textarea-bordered w-full h-24 ${errors.description ? 'textarea-error' : ''}`}
              placeholder="请详细描述活动内容、要求等信息"
            />
            {errors.description && <div className="text-error text-sm mt-1">{errors.description}</div>}
          </div>

          {/* 时间设置 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">
                <span className="label-text">开始时间 *</span>
              </label>
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors.start_time ? 'input-error' : ''}`}
              />
              {errors.start_time && <div className="text-error text-sm mt-1">{errors.start_time}</div>}
            </div>

            <div>
              <label className="label">
                <span className="label-text">结束时间 *</span>
              </label>
              <input
                type="datetime-local"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors.end_time ? 'input-error' : ''}`}
              />
              {errors.end_time && <div className="text-error text-sm mt-1">{errors.end_time}</div>}
            </div>

            <div>
              <label className="label">
                <span className="label-text">报名截止时间 *</span>
              </label>
              <input
                type="datetime-local"
                name="registration_deadline"
                value={formData.registration_deadline}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${errors.registration_deadline ? 'input-error' : ''}`}
              />
              {errors.registration_deadline && <div className="text-error text-sm mt-1">{errors.registration_deadline}</div>}
            </div>
          </div>

          {/* 参与人数和费用 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">
                <span className="label-text">最大参与人数 *</span>
              </label>
              <input
                type="number"
                name="max_participants"
                value={formData.max_participants}
                onChange={handleInputChange}
                min="1"
                className={`input input-bordered w-full ${errors.max_participants ? 'input-error' : ''}`}
              />
              {errors.max_participants && <div className="text-error text-sm mt-1">{errors.max_participants}</div>}
            </div>

            <div>
              <label className="label">
                <span className="label-text">费用类型 *</span>
              </label>
              <select
                name="fee_type"
                value={formData.fee_type}
                onChange={handleInputChange}
                className="select select-bordered w-full"
              >
                <option value={FeeType.FREE}>免费</option>
                <option value={FeeType.AA}>AA制</option>
                <option value={FeeType.PREPAID_ALL}>预付全部费用</option>
                <option value={FeeType.PREPAID_REFUNDABLE}>预付多退少补</option>
              </select>
            </div>

            <div>
              <label className="label">
                <span className="label-text">费用金额</span>
              </label>
              <input
                type="number"
                name="fee_amount"
                value={formData.fee_amount}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                disabled={formData.fee_type === FeeType.FREE}
                className={`input input-bordered w-full ${errors.fee_amount ? 'input-error' : ''} ${formData.fee_type === FeeType.FREE ? 'input-disabled' : ''}`}
              />
              {errors.fee_amount && <div className="text-error text-sm mt-1">{errors.fee_amount}</div>}
            </div>
          </div>

          {/* 封面图片 */}
          <div>
            <label className="label">
              <span className="label-text">封面图片</span>
            </label>
            <div className="relative">
              <input
                type="url"
                name="cover_image_url"
                value={formData.cover_image_url}
                onChange={handleInputChange}
                className={`input input-bordered w-full ${(coverPreviewStatus === 'loaded' || coverPreviewStatus === 'error') ? 'pr-10' : ''}`}
                placeholder="请输入图片URL"
              />
              {coverPreviewStatus === 'loaded' && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-success" aria-label="封面图片已加载">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879A1 1 0 106.293 10.293l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
              {coverPreviewStatus === 'error' && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-error" aria-label="封面图片加载失败">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm2.28-10.28a.75.75 0 10-1.06-1.06L10 8.94 8.78 7.72a.75.75 0 10-1.06 1.06L8.94 10l-1.22 1.22a.75.75 0 101.06 1.06L10 11.06l1.22 1.22a.75.75 0 101.06-1.06L11.06 10l1.22-1.22z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
            {formData.cover_image_url && (
              <div className="mt-2">
                {coverPreviewStatus === 'error' ? (
                  <div className="text-error text-sm">图片预览加载失败，请确认图片 URL 是否正确</div>
                ) : (
                  <div className="relative w-full rounded-lg overflow-hidden bg-base-200 flex items-center justify-center min-h-24">
                    {coverPreviewStatus === 'loading' && (
                      <span className="loading loading-spinner loading-sm" aria-label="封面预览加载中" />
                    )}
                    <img
                      src={formData.cover_image_url}
                      alt="封面预览"
                      className={`max-h-64 w-auto h-auto object-contain transition-opacity duration-200 ${coverPreviewStatus === 'loading' ? 'opacity-0' : 'opacity-100'}`}
                      onLoad={() => setCoverPreviewStatus('loaded')}
                      onError={() => setCoverPreviewStatus('error')}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 活动状态（仅编辑模式） */}
          {isEditMode && (
            <div>
              <label className="label">
                <span className="label-text">活动状态</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="select select-bordered w-full"
              >
                <option value={ActivityStatus.PREPARING}>筹备中</option>
                <option value={ActivityStatus.RECRUITING}>报名中</option>
                <option value={ActivityStatus.FINISHED}>已结束</option>
                <option value={ActivityStatus.CANCELLED}>已取消</option>
              </select>
            </div>
          )}

          {/* 活动图片 */}
          <div>
            <label className="label">
              <span className="label-text">活动图片</span>
            </label>
            <div className="space-y-2">
              {formData.images.map((url, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => {
                          const newImages = [...formData.images];
                          newImages[index] = e.target.value;
                          setFormData(prev => ({ ...prev, images: newImages }));
                        }}
                        className={`input input-bordered w-full ${(imagePreviewStatus[index] === 'loaded' || imagePreviewStatus[index] === 'error') ? 'pr-10' : ''}`}
                        placeholder="图片URL"
                      />
                      {imagePreviewStatus[index] === 'loaded' && (
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-success" aria-label={`活动图片${index + 1}已加载`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879A1 1 0 106.293 10.293l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                      {imagePreviewStatus[index] === 'error' && (
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-error" aria-label={`活动图片${index + 1}加载失败`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm2.28-10.28a.75.75 0 10-1.06-1.06L10 8.94 8.78 7.72a.75.75 0 10-1.06 1.06L8.94 10l-1.22 1.22a.75.75 0 101.06 1.06L10 11.06l1.22 1.22a.75.75 0 101.06-1.06L11.06 10l1.22-1.22z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="btn btn-error btn-sm"
                    >
                      删除
                    </button>
                  </div>
                  {url && (
                    <div className="w-full">
                      {imagePreviewStatus[index] === 'error' ? (
                        <div className="text-error text-sm">图片预览加载失败，请确认图片 URL 是否正确</div>
                      ) : (
                        <div className="w-full rounded-lg overflow-hidden bg-base-200 flex items-center justify-center min-h-24">
                          {imagePreviewStatus[index] === 'loading' && (
                            <span className="loading loading-spinner loading-xs" aria-label="图片预览加载中" />
                          )}
                          <img
                            src={url}
                            alt={`活动图片${index + 1}`}
                            className={`max-h-64 w-auto h-auto object-contain ${imagePreviewStatus[index] === 'loading' ? 'opacity-0' : 'opacity-100'}`}
                            onLoad={() => setImagePreviewStatus(prev => ({ ...prev, [index]: 'loaded' }))}
                            onError={() => setImagePreviewStatus(prev => ({ ...prev, [index]: 'error' }))}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addImage}
                className="btn btn-outline btn-sm"
              >
                添加图片
              </button>
            </div>
          </div>

          {/* 表单按钮 */}
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClose}
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className={`btn btn-primary ${loading ? 'loading' : ''}`}
              disabled={loading || (isEditMode && !!isRegistrationExpired)}
            >
              {loading ? '保存中...' : (isEditMode ? '更新活动' : '发布活动')}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
};

export default ActivityFormModal;
