/**
 * 快速启动开发服务器
 */

const { spawn } = require('child_process')
const path = require('path')

console.log('🚀 启动 DAMO Cashier 开发服务器...\n')

// 检查 node_modules 是否存在
const fs = require('fs')
if (!fs.existsSync('node_modules')) {
  console.log('📦 正在安装依赖...')
  const install = spawn('npm', ['install'], { stdio: 'inherit' })
  
  install.on('close', (code) => {
    if (code === 0) {
      startServer()
    } else {
      console.error('❌ 依赖安装失败')
      process.exit(1)
    }
  })
} else {
  startServer()
}

function startServer() {
  console.log('🌐 启动服务器...')
  console.log('')
  console.log('📱 访问地址:')
  console.log('   主应用: http://localhost:8091')
  console.log('   源码版本: http://localhost:8092')
  console.log('   性能测试: http://localhost:8092/test-order-performance.html')
  console.log('')
  console.log('按 Ctrl+C 停止服务器')
  console.log('')

  // 启动构建版本服务器 (端口 8091)
  const server1 = spawn('npx', [
    'http-server', 
    'unpackage/dist/build/web', 
    '-p', '8091', 
    '-c-1', 
    '--cors'
  ], { 
    stdio: ['inherit', 'pipe', 'pipe']
  })

  // 启动源码版本服务器 (端口 8092)  
  const server2 = spawn('npx', [
    'http-server', 
    '.', 
    '-p', '8092', 
    '-c-1', 
    '--cors'
  ], { 
    stdio: ['inherit', 'pipe', 'pipe']
  })

  server1.stdout.on('data', (data) => {
    console.log(`[8091] ${data}`)
  })

  server1.stderr.on('data', (data) => {
    console.log(`[8091] ${data}`)
  })

  server2.stdout.on('data', (data) => {
    console.log(`[8092] ${data}`)
  })

  server2.stderr.on('data', (data) => {
    console.log(`[8092] ${data}`)
  })

  // 处理退出
  process.on('SIGINT', () => {
    console.log('\n🛑 正在停止服务器...')
    server1.kill()
    server2.kill()
    process.exit(0)
  })

  server1.on('close', (code) => {
    console.log(`服务器 8091 已停止 (代码: ${code})`)
  })

  server2.on('close', (code) => {
    console.log(`服务器 8092 已停止 (代码: ${code})`)
  })
}