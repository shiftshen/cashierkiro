var site = {
	version: "1.0",
	screenurl:"web/index.html#/",//web/index.html#/  http://192.168.1.99:8080/#/
	// siteroot: "https://v3.bkycms.com",
	siteroot: 'https://www.vdamo.com',//http://212.64.23.83:8081 https://www.vdamo.com
}
if (process.env.NODE_ENV !== 'development') {
	// #ifdef H5
	  site.siteroot = 'https://www.vdamo.com'
	// #endif
	console.log('produce')
} else {
	console.log('development')
}
module.exports = site