const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

// 模拟API数据
const mockData = {
  '/channel/login': {
    method: 'POST',
    response: {
      code: 200,
      message: 'success',
      data: {
        id: 12,
        username: 'test002',
        nickname: 'test002',
        role_id: 2,
        mobile: '',
        token: 'mock_token_' + Date.now(),
        permissions: ['diandan', 'zhuotai', 'jiaohao', 'dingdan', 'huiyuan', 'tiaozhengyue', 'tiaozhengjifen', 'duizhang']
      }
    }
  },
  '/channel/handover/starting': {
    method: 'GET',
    response: {
      code: 200,
      message: 'success',
      data: {
        status: 'started',
        shift_id: 1,
        start_time: new Date().toISOString()
      }
    }
  },
  '/common/app/cashierupgrade': {
    method: 'GET',
    response: {
      code: 200,
      message: 'success',
      data: {
        name: 'DAMO CASHIER1',
        version: '1.4.6',
        versionCode: '146',
        hasUpdate: false,
        changelog: [],
        downloadUrl: '',
        description: 'DAMO收银系统'
      }
    }
  }
};

const server = http.createServer((req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 处理API请求
  if (mockData[pathname]) {
    const mockApi = mockData[pathname];
    if (req.method === mockApi.method || mockApi.method === 'ALL') {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      
      // 对于POST请求，读取请求体
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          console.log(`API请求: ${req.method} ${pathname}`, body ? JSON.parse(body) : '');
          res.end(JSON.stringify(mockApi.response));
        });
      } else {
        console.log(`API请求: ${req.method} ${pathname}`);
        res.end(JSON.stringify(mockApi.response));
      }
      return;
    }
  }

  // 处理静态文件
  const webRoot = path.join(__dirname, '../unpackage/dist/build/web');
  let filePath = path.join(webRoot, pathname === '/' ? 'index.html' : pathname);

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    // 如果是SPA路由，返回index.html
    if (!path.extname(pathname)) {
      filePath = path.join(webRoot, 'index.html');
    } else {
      res.writeHead(404);
      res.end('File not found');
      return;
    }
  }

  // 读取文件
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Server error');
      return;
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache');
    res.writeHead(200);
    res.end(data);
  });
});

const PORT = 8092;
server.listen(PORT, () => {
  console.log(`🚀 开发服务器启动成功！`);
  console.log(`📱 访问地址: http://localhost:${PORT}`);
  console.log(`🔧 支持CORS和API模拟`);
  console.log(`📋 模拟API端点:`);
  Object.keys(mockData).forEach(endpoint => {
    console.log(`   ${mockData[endpoint].method} ${endpoint}`);
  });
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 服务器正在关闭...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});