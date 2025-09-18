import config from '@/custom/config.js';
import site from '@/custom/siteroot.js';
import api from '@/api';
import i18n from '@/locale/index.js'
export default {
	request: async function(option) {
		// 性能监控 - 开始监控API请求
		let performanceMonitor = null
		let requestId = null
		const startTime = Date.now()
		
		try {
			const module = await import('./performance-monitor.js')
			performanceMonitor = module.default
			requestId = performanceMonitor.monitorAPIRequest(
				site.siteroot + option.url, 
				option.method || 'GET', 
				startTime
			)
		} catch (error) {
			// 性能监控加载失败，不影响正常请求
		}
		
		if (option.mask) {
			uni.showLoading({
				title: option.mask == 1 ? 'Loading...' : option.mask,
				mask: true
			});
		}
		var option = option || {};
		if (!option.url) {
			return false;
		}
		//console.log('1212', site.siteroot + option.url)
		return new Promise((resolve, reject) => {
			uni.request({
				url: site.siteroot + option.url,
				data: option.data ? option.data : {},
				method: option.method ? option.method : 'GET',
				header: {
					contentType: config.contentType,
					appType: 'cashier',
					lang: i18n.locale,
					uniacid: uni.getStorageSync('uniacid'),
					storeId: uni.getStorageSync('storeId'),
					Authorization: `Bearer ${uni.getStorageSync('token')}`,
				},
				complete: (res) => {
					//console.log('ree', res?.data)
					if (option.mask) {
						uni.hideLoading();
					}
					
					// 性能监控 - 记录请求完成
					if (performanceMonitor && requestId) {
						const success = res?.data?.code == 200
						const error = success ? null : (res?.data?.msg || res?.msg || '请求失败')
						performanceMonitor.completeAPIRequest(requestId, success, error)
					}
					
					if (res?.data?.code == 200) {
						resolve(res.data)
					} else {
						if (res?.data?.code == 400) {
							resolve(res.data)
							config.tokenErrorMessage(res.data.msg || res.msg)
						} else if (res?.data?.code == 401) {
							config.tokenErrorMessage(res.data.msg || res.msg)
							uni.removeStorageSync('token')
							uni.removeStorageSync('storeId')
							uni.reLaunch({
								url: `/pages/login/index`
							})
						} else {
							config.tokenErrorMessage(res.data.msg || res.msg)
						}
					}
				}
			});
		})
	}
}