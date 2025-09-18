export default {
	contentType: 'application/x-www-form-urlencoded',
	tokenErrorMessage: function(m) {
		uni.showToast({
			title: m || "Request failed, please try again",
			icon: "none"
		})
	}
}