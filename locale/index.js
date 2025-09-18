import en from './en.json'//英语语言包
import zh from './zh.json'
import th from './th.json'
import Vue from 'vue'
import VueI18n from 'vue-i18n'
Vue.use(VueI18n);

const lang = uni.getStorageSync('language') || 'en';

const i18nConfig = new VueI18n({
  locale: lang, // 设置默认语言
  messages: {
    en: en,
    zh: zh,
	th: th
  }
});
const i18n = new VueI18n(i18nConfig)

export default i18n