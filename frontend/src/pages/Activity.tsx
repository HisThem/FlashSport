import React from 'react';

const Activities: React.FC = () => {
  return (
    <div className="min-h-screen bg-base-100 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">
            活动项目
          </h1>
          <p className="text-lg text-base-content/80 max-w-2xl mx-auto">
            探索丰富多彩的体育活动，找到最适合您的运动项目，享受运动带来的乐趣！
          </p>
        </div>

        {/* 活动分类 */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-4">
            <button className="btn btn-primary">全部活动</button>
            <button className="btn btn-outline">球类运动</button>
            <button className="btn btn-outline">健身运动</button>
            <button className="btn btn-outline">水上运动</button>
            <button className="btn btn-outline">户外运动</button>
            <button className="btn btn-outline">团队运动</button>
          </div>
        </div>

        {/* 活动卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 篮球活动 */}
          <div className="card bg-base-100 shadow-xl">
            <figure>  
              <img 
                src="https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                alt="篮球" 
                className="h-48 w-full object-cover"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">
                篮球
                <div className="badge badge-secondary">热门</div>
              </h2>
              <p>锻炼身体协调性，提升团队合作能力，享受激烈的竞技乐趣。</p>
              <div className="card-actions justify-end">
                <div className="badge badge-outline">团队运动</div>
                <div className="badge badge-outline">室内外</div>
              </div>
              <button className="btn btn-primary mt-4">查看详情</button>
            </div>
          </div>

          {/* 游泳活动 */}
          <div className="card bg-base-100 shadow-xl">
            <figure>
              <img 
                src="https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                alt="游泳" 
                className="h-48 w-full object-cover"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">
                游泳
                <div className="badge badge-accent">推荐</div>
              </h2>
              <p>全身性有氧运动，增强心肺功能，低冲击力运动适合各年龄段。</p>
              <div className="card-actions justify-end">
                <div className="badge badge-outline">水上运动</div>
                <div className="badge badge-outline">有氧运动</div>
              </div>
              <button className="btn btn-primary mt-4">查看详情</button>
            </div>
          </div>

          {/* 瑜伽活动 */}
          <div className="card bg-base-100 shadow-xl">
            <figure>
              <img 
                src="https://images.unsplash.com/photo-1506629905607-45c7bc7f7bcd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                alt="瑜伽" 
                className="h-48 w-full object-cover"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">瑜伽</h2>
              <p>提升身体柔韧性，增强核心力量，缓解压力，获得内心平静。</p>
              <div className="card-actions justify-end">
                <div className="badge badge-outline">健身运动</div>
                <div className="badge badge-outline">室内</div>
              </div>
              <button className="btn btn-primary mt-4">查看详情</button>
            </div>
          </div>

          {/* 跑步活动 */}
          <div className="card bg-base-100 shadow-xl">
            <figure>
              <img 
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                alt="跑步" 
                className="h-48 w-full object-cover"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">
                跑步
                <div className="badge badge-secondary">热门</div>
              </h2>
              <p>最简单有效的有氧运动，增强心肺功能，燃烧卡路里，释放压力。</p>
              <div className="card-actions justify-end">
                <div className="badge badge-outline">有氧运动</div>
                <div className="badge badge-outline">户外运动</div>
              </div>
              <button className="btn btn-primary mt-4">查看详情</button>
            </div>
          </div>

          {/* 足球活动 */}
          <div className="card bg-base-100 shadow-xl">
            <figure>
              <img 
                src="https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                alt="足球" 
                className="h-48 w-full object-cover"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">足球</h2>
              <p>世界最受欢迎的运动，提升团队协作，增强体能和反应能力。</p>
              <div className="card-actions justify-end">
                <div className="badge badge-outline">团队运动</div>
                <div className="badge badge-outline">户外</div>
              </div>
              <button className="btn btn-primary mt-4">查看详情</button>
            </div>
          </div>

          {/* 健身房活动 */}
          <div className="card bg-base-100 shadow-xl">
            <figure>
              <img 
                src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                alt="健身房" 
                className="h-48 w-full object-cover"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">健身房训练</h2>
              <p>专业器械训练，科学健身计划，塑造完美身形，提升整体健康水平。</p>
              <div className="card-actions justify-end">
                <div className="badge badge-outline">力量训练</div>
                <div className="badge badge-outline">室内</div>
              </div>
              <button className="btn btn-primary mt-4">查看详情</button>
            </div>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="mt-16">
          <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
            <div className="stat">
              <div className="stat-figure text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block h-8 w-8 stroke-current">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
              <div className="stat-title">活动项目</div>
              <div className="stat-value text-primary">8+</div>
              <div className="stat-desc">涵盖主流运动项目</div>
            </div>

            <div className="stat">
              <div className="stat-figure text-secondary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block h-8 w-8 stroke-current">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <div className="stat-title">参与用户</div>
              <div className="stat-value text-secondary">1.2K+</div>
              <div className="stat-desc">活跃运动爱好者</div>
            </div>

            <div className="stat">
              <div className="stat-figure text-accent">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block h-8 w-8 stroke-current">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
                </svg>
              </div>
              <div className="stat-title">每月活动</div>
              <div className="stat-value text-accent">46+</div>
              <div className="stat-desc">精彩活动等你参与</div>
            </div>

            <div className="stat">
              <div className="stat-figure text-info">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block h-8 w-8 stroke-current">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <div className="stat-title">满意度</div>
              <div className="stat-value text-info">98%</div>
              <div className="stat-desc">用户满意度评分</div>
            </div>
          </div>
        </div>

        {/* 号召行动 */}
        <div className="mt-16 text-center">
          <div className="hero bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl">
            <div className="hero-content text-center py-12">
              <div className="max-w-md">
                <h2 className="text-3xl font-bold text-primary mb-4">
                  开始您的运动之旅
                </h2>
                <p className="text-lg mb-6 text-base-content/80">
                  选择您喜爱的活动项目，加入我们的运动社区，与更多运动爱好者一起享受健康生活！
                </p>
                <button className="btn btn-primary btn-lg">
                  立即参与活动
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Activities;
