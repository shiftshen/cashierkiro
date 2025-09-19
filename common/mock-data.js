
// 桌台数据模拟器
export const mockTableData = {
    // 模拟区域数据
    areas: [
        { id: 1, name: '大厅', sort: 1 },
        { id: 2, name: '包间', sort: 2 },
        { id: 3, name: '露台', sort: 3 }
    ],
    
    // 模拟桌台数据
    tables: [
        { id: 1, name: '1号桌', areaId: 1, status: 'free', capacity: 4, x: 100, y: 100 },
        { id: 2, name: '2号桌', areaId: 1, status: 'order', capacity: 6, x: 200, y: 100 },
        { id: 3, name: '3号桌', areaId: 1, status: 'settle', capacity: 4, x: 300, y: 100 },
        { id: 4, name: '4号桌', areaId: 1, status: 'prepare', capacity: 8, x: 100, y: 200 },
        { id: 5, name: '5号桌', areaId: 1, status: 'machine', capacity: 4, x: 200, y: 200 },
        { id: 6, name: '6号桌', areaId: 1, status: 'free', capacity: 6, x: 300, y: 200 },
        { id: 7, name: '包间A', areaId: 2, status: 'order', capacity: 10, x: 100, y: 100 },
        { id: 8, name: '包间B', areaId: 2, status: 'free', capacity: 12, x: 200, y: 100 },
        { id: 9, name: '露台1', areaId: 3, status: 'settle', capacity: 4, x: 100, y: 100 },
        { id: 10, name: '露台2', areaId: 3, status: 'free', capacity: 4, x: 200, y: 100 }
    ],
    
    // 获取桌台列表
    getTableList(areaId = null, status = null) {
        let tables = this.tables;
        
        if (areaId) {
            tables = tables.filter(table => table.areaId === areaId);
        }
        
        if (status) {
            tables = tables.filter(table => table.status === status);
        }
        
        return tables;
    },
    
    // 获取桌台统计
    getTableStats() {
        const stats = {
            all: this.tables.length,
            free: 0,
            order: 0,
            settle: 0,
            prepare: 0,
            machine: 0
        };
        
        this.tables.forEach(table => {
            if (stats[table.status] !== undefined) {
                stats[table.status]++;
            }
        });
        
        return stats;
    },
    
    // 更新桌台状态
    updateTableStatus(tableId, newStatus) {
        const table = this.tables.find(t => t.id === tableId);
        if (table) {
            table.status = newStatus;
            return true;
        }
        return false;
    }
};

// 模拟会员数据
export const mockMemberData = {
    members: [
        { id: 1, phone: '13800138001', name: '张三', balance: 500.00, points: 1200 },
        { id: 2, phone: '13800138002', name: '李四', balance: 300.50, points: 800 },
        { id: 3, phone: '13800138003', name: '王五', balance: 1000.00, points: 2500 }
    ],
    
    // 根据手机号查找会员
    findByPhone(phone) {
        return this.members.find(member => member.phone === phone);
    },
    
    // 根据会员卡号查找会员
    findByCard(cardNumber) {
        // 简化：使用手机号后4位作为卡号
        const phone = '138001380' + cardNumber.padStart(2, '0');
        return this.findByPhone(phone);
    },
    
    // 根据手机号后4位查找会员
    findByLastFour(lastFour) {
        return this.members.find(member => 
            member.phone.slice(-4) === lastFour.padStart(4, '0')
        );
    }
};

export default { mockTableData, mockMemberData };
