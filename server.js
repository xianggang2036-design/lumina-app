const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// 1. 根目录欢迎页
app.get('/', (req, res) => {
  res.send('Lumina AI Lead Qualification System is Running! 🚀');
});

// 2. 测试路由
app.get('/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Test route is working perfectly!',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`🚀 服务已成功运行在端口 ${port}`);
});
