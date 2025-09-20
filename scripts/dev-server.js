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

// 生成模拟餐桌数据
function generateTables() {
  const tables = [];
  for (let i = 1; i <= 20; i++) {
    tables.push({
      id: i,
      name: `桌台${i}`,
      state: Math.floor(Math.random() * 5), // 0-4随机状态
      people: Math.floor(Math.random() * 6) + 1,
      scan: Math.random() > 0.5 ? 1 : 0,
      minutes: Math.floor(Math.random() * 120),
      type: { max: 8 },
      order: Math.random() > 0.5 ? { money: (Math.random() * 500 + 50).toFixed(2) } : null
    });
  }
  return tables;
}

// 生成模拟商品数据
function generateGoods() {
  const goods = [];
  const categories = ['热销', '饮品', '主食', '小食', '甜品'];
  
  for (let i = 1; i <= 50; i++) {
    goods.push({
      goods: {
        id: i,
        name: `商品${i}`,
        logo: `https://picsum.photos/100/100?random=${i}`,
        channelIds: [1, 2],
        specSwitch: 0,
        singleSpec: {
          price: (Math.random() * 100 + 10).toFixed(2),
          inStorePrice: (Math.random() * 100 + 10).toFixed(2),
          sales: Math.floor(Math.random() * 1000),
          surplusInventory: Math.floor(Math.random() * 100)
        },
        category: [{ name: categories[Math.floor(Math.random() * categories.length)] }],
        mixPrice: (Math.random() * 50 + 5).toFixed(2),
        maxPrice: (Math.random() * 150 + 50).toFixed(2),
        minInStorePrice: (Math.random() * 50 + 5).toFixed(2),
        maxInStorePrice: (Math.random() * 150 + 50).toFixed(2)
      },
      deleted_at: Math.random() > 0.8 ? new Date() : null,
      selfPriceSwitch: Math.random() > 0.5 ? 1 : 0
    });
  }
  return goods;
}

// 模拟API数据
const mockData = {
  '/channel/login': {
    method: 'POST',
    response: {
      code: 200,
      msg: 'success',
      data: {
        token: 'mock_token_12345',
        user: {
          id: 12,
          username: 'test001',
          nickname: 'test001',
          role_id: 2,
          mobile: '',
          uniacid: 123,
          storeId: 1
        },
        role: ['diandan', 'zhuotai', 'jiaohao', 'dingdan', 'huiyuan', 'tiaozhengyue', 'tiaozhengjifen', 'duizhang', 'shangxiajia', 'kucun']
      }
    }
  },
  '/channel/handover/starting': {
    method: 'GET',
    response: {
      code: 200,
      msg: 'success',
      data: {
        status: 'started',
        time: new Date().toISOString()
      }
    }
  },
  '/channel/table/area': {
    method: 'GET',
    response: {
      code: 200,
      msg: 'success',
      data: {
        list: [
          { id: 1, name: '大厅' },
          { id: 2, name: '包间' },
          { id: 3, name: '露台' }
        ]
      }
    }
  },
  '/channel/inStore/table': {
    method: 'GET',
    response: {
      code: 200,
      msg: 'success',
      data: {
        list: generateTables()
      }
    }
  },
  '/channel/inStore/table/count': {
    method: 'GET',
    response: {
      code: 200,
      msg: 'success',
      data: {
        allCount: 20,
        freeCount: 8,
        orderCount: 5,
        settleCount: 4,
        prepareCount: 2,
        machineCount: 1
      }
    }
  },
  '/channel/store/goods': {
    method: 'GET',
    response: {
      code: 200,
      msg: 'success',
      data: {
        list: generateGoods(),
        total: 50
      }
    }
  },
  '/channel/store/goods/category': {
    method: 'GET',
    response: {
      code: 200,
      msg: 'success',
      data: {
        list: [
          { value: '', text: '全部' },
          { value: 1, text: '热销' },
          { value: 2, text: '饮品' },
          { value: 3, text: '主食' },
          { value: 4, text: '小食' },
          { value: 5, text: '甜品' }
        ]
      }
    }
  },
  '/channel/inStore/goods': {
    method: 'GET',
    response: {
      code: 200,
      msg: 'success',
      data: {
        list: generateGoods(),
        total: 50
      }
    }
  },
  '/channel/inStore/goods/category': {
    method: 'GET',
    response: {
      code: 200,
      msg: 'success',
      data: {
        list: [
          { id: '', name: '全部' },
          { id: 1, name: '热销' },
          { id: 2, name: '饮品' },
          { id: 3, name: '主食' },
          { id: 4, name: '小食' },
          { id: 5, name: '甜品' }
        ]
      }
    }
  },
  '/common/app/cashierupgrade': {
    method: 'GET',
    response: {
      code: 200,
      msg: 'success',
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
          console.log(`🔗 API请求: ${req.method} ${pathname}`, body ? JSON.parse(body) : '');
          res.end(JSON.stringify(mockApi.response));
        });
      } else {
        console.log(`🔗 API请求: ${req.method} ${pathname}`, parsedUrl.query);
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
  console.log(`🔧 支持CORS和完整API模拟`);
  console.log(`📋 模拟API端点:`);
  Object.keys(mockData).forEach(endpoint => {
    console.log(`   ${mockData[endpoint].method} ${endpoint}`);
  });
  console.log(`🎯 现在可以正常显示菜单和餐桌数据了！`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 服务器正在关闭...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});