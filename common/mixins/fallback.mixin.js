export default {
  data() {
    return {
      pc: this.$data?.pc ?? false,
      pad: this.$data?.pad ?? false
    };
  },
  created() {
    // 若组件未实现方法，则提供 no-op，避免事件绑定报错
    const noop = () => {};
    this.openSave = this.openSave || noop;
    this.changeLanguage = this.changeLanguage || noop;
    this.fetchData = this.fetchData || noop;
  }
};