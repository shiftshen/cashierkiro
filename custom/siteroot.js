// 检测运行环境
const isApp = typeof plus !== 'undefined' || process.env.UNI_PLATFORM === 'app-plus';
const isDev = process.env.NODE_ENV === 'development';

var site = {
	version: "1.0",
	screenurl:"web/index.html#/",//web/index.html#/  http://192.168.1.99:8080/#/
	// APP和H5使用不同的地址配置
	siteroot: isApp ? 'https://www.vdamo.com' : (isDev ? 'http://localhost:8092' : 'https://www.vdamo.com'),
	socketUrl: isApp ? 'wss://www.vdamo.com/ws' : (isDev ? 'ws://localhost:8092/ws' : 'wss://www.vdamo.com/ws'),
	// 添加环境标识
	isApp: isApp,
	isDev: isDev,
	timeout: isApp ? 10000 : 5000
}

if (process.env.NODE_ENV !== 'development') {
	// #ifdef H5
	  site.siteroot = 'https://www.vdamo.com'
	  site.socketUrl = 'wss://www.vdamo.com/ws'
	// #endif
	console.log('produce')
} else {
	console.log('development')
}
module.exports = site