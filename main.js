import App from './App'
// 导入UView兼容性修复 - 必须在最早期加载
import '@/common/utils/uview-app-fix.js'
import store from './store'
import request from '@/common/request';
import api from '@/api';
// import dLoading from '@/uni_modules/d-loading/components/d-loading/d-loading.vue'
import i18n from './locale/index.js'
// #ifndef VUE3
import Vue from 'vue'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
	store,
	i18n,
	...App
})
import uView from '@/uni_modules/uview-ui'
Vue.use(uView)

// 全局mixin解决缺失属性和方法问题
import FallbackMixin from '@/common/mixins/fallback.mixin.js'
Vue.mixin(FallbackMixin)

// 导入消息适配器
import { sndMsgToHtml, TwoDisplayAdapter, SerialPortAdapter } from '@/common/utils/msg-adapter.js'

Vue.prototype.beg = request
Vue.prototype.api = api
Vue.prototype.$sndMsgToHtml = sndMsgToHtml
Vue.prototype.$twoDisplay = TwoDisplayAdapter
Vue.prototype.$serialPort = SerialPortAdapter
// Vue.component('dLoading',dLoading)

app.$mount()
// #endif

// #ifdef VUE3
import {
	createSSRApp
} from 'vue'
export function createApp() {
	const app = createSSRApp(App)
	return {
		app
	}
}
// #endif