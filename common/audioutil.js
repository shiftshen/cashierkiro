// audioConfig.js
const audioConfig = {
	CH0: "CH0.mp3",
	CH1: "CH1.mp3",
	CH2: "CH2.mp3",
	CH3: "CH3.mp3",
	CH4: "CH4.mp3",
	CH5: "CH5.mp3",
	CH6: "CH6.mp3",
	CH7: "CH7.mp3",
	CH8: "CH8.mp3",
	CH9: "CH9.mp3",
	SHI: "SHI.mp3",
	BAI: "BAI.mp3",
	QAN: "QAN.mp3",
	WAN: "WAN.mp3",
	CHA: "CHA.mp3",
	CHB: "CHB.mp3",
	CHC: "CHC.mp3",
	CHD: "CHD.mp3",
	CHE: "CHE.mp3",
	CHF: "CHF.mp3",
	CHG: "CHG.mp3",
	CHH: "CHH.mp3",
	CHI: "CHI.mp3",
	CHJ: "CHJ.mp3",
	CHK: "CHK.mp3",
	CHL: "CHL.mp3",
	CHM: "CHM.mp3",
	CHN: "CHN.mp3",
	CHO: "CHO.mp3",
	CHP: "CHP.mp3",
	CHQ: "CHQ.mp3",
	CHR: "CHR.mp3",
	CHS: "CHS.mp3",
	CHT: "CHT.mp3",
	CHU: "CHU.mp3",
	CHV: "CHV.mp3",
	CHW: "CHW.mp3",
	CHX: "CHX.mp3",
	CHY: "CHY.mp3",
	CHZ: "CHZ.mp3",
	zhuohao: "134.mp3",
	qingyongcan: "146.mp3",
};

function numberToKey(num) {
	const numMapping = {
		'0': 'CH0',
		'1': 'CH1',
		'2': 'CH2',
		'3': 'CH3',
		'4': 'CH4',
		'5': 'CH5',
		'6': 'CH6',
		'7': 'CH7',
		'8': 'CH8',
		'9': 'CH9',
	};
	return numMapping[num] || '';
}

function convertQueuingCode(code) {
    code = code.replace(/\s/g, '');
    const chars = code.split('');
    const mp3Files = chars.map(char => {
        if (/[0-9]/.test(char)) {
            // 数字
            return audioConfig[`CH${char}`] || '';
        } else if (/[A-Za-z]/.test(char)) {
            // 字母（转换为大写）
            return audioConfig[`CH${char.toUpperCase()}`] || '';
        } else {
            // 其他字符，忽略
            return '';
        }
    }).filter(file => file !== ''); // 移除空字符串
    return ['135.mp3', ...mp3Files, '147.mp3'];
}

// 导出配置和方法
export {
	audioConfig,
	convertQueuingCode
};