const fs = require('fs');
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, 'data', 'flashsport.db');
const dbShmPath = path.join(__dirname, 'data', 'flashsport.db-shm');
const dbWalPath = path.join(__dirname, 'data', 'flashsport.db-wal');

console.log('正在清理数据库文件...');

try {
  // 删除主数据库文件
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✅ 删除 flashsport.db');
  }

  // 删除共享内存文件
  if (fs.existsSync(dbShmPath)) {
    fs.unlinkSync(dbShmPath);
    console.log('✅ 删除 flashsport.db-shm');
  }

  // 删除WAL文件
  if (fs.existsSync(dbWalPath)) {
    fs.unlinkSync(dbWalPath);
    console.log('✅ 删除 flashsport.db-wal');
  }

  console.log('🎉 数据库清理完成！');
  console.log('📝 现在可以重新启动应用以初始化新的图片数据');
  console.log('💡 运行: npm run start:dev');

} catch (error) {
  console.error('❌ 清理数据库时发生错误:', error.message);
  console.log('💡 请确保应用已停止运行，然后重试');
}
