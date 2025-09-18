
const express = require('express');
const path = require('path');
const app = express();
const port = 8092;

// 设置静态文件目录
app.use(express.static('unpackage/dist/build/web'));

// 处理 SPA 路由
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'unpackage/dist/build/web', 'index.html'));
});

app.listen(port, () => {
    console.log('🚀 测试服务器运行在 http://localhost:' + port);
});
