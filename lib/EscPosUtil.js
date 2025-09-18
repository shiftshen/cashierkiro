const iconv = require('iconv-lite');

class EscPosUtil {
	constructor() {
		this.commands = [];
	}

	// 初始化打印机
	initPrinter() {
		this.commands.push(0x1B, 0x40); // ESC @
		return this;
	}

	// 换行
	newLine(count = 1) {
		for (let i = 0; i < count; i++) {
			this.commands.push(0x0A); // LF
		}
		return this;
	}

	// 打印文本
	printText(text, encoding = 'UTF-8') { // 默认使用 UTF-8 编码
		const encodedText = iconv.encode(text, encoding);
		this.commands.push(...encodedText);
		return this;
	}

	// 设置对齐方式
	setAlignment(alignment) {
		this.commands.push(0x1B, 0x61, alignment); // ESC a
		return this;
	}


	// 启用加粗
	setBold() {
		this.commands.push(0x1B, 0x45, 0x01); // ESC E
		return this;
	}

	// 禁用加粗
	unsetBold() {
		this.commands.push(0x1B, 0x45, 0x00); // ESC E
		return this;
	}

	// 设置字体大小
	setFontSize(size) {
		this.commands.push(0x1D, 0x21, size); // GS !
		return this;
	}

	// 切纸
	cutPaper() {
		this.commands.push(0x1D, 0x56, 0x00); // GS V 0
		return this;
	}

	// 获取生成的指令
	getCommands() {
		return new Uint8Array(this.commands);
	}

	// 获取生成指令的十六进制字符串
	getCommandsHexString() {
		return this.commands.map(byte => byte.toString(16).padStart(2, '0')).join('');
	}
}

// 导出类
module.exports = EscPosUtil;