// public/javascripts/admin-dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    const lineChartCanvas = document.getElementById('revenueChart');
    const pieChartCanvas = document.getElementById('paymentMethodChart');
    if (!lineChartCanvas || !pieChartCanvas) return; 

    let revenueChartInstance;
    let pieChartInstance;

    const statOrders = document.getElementById('adv-stat-orders');
    const statPaid = document.getElementById('adv-stat-paid');
    const statCOD = document.getElementById('adv-stat-cod');
    const statVNPAY = document.getElementById('adv-stat-vnpay');

    // === Cấu hình Biểu đồ Đường (Line Chart) ===
    const lineChartConfig = {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                // 0: Doanh thu
                {
                    label: 'Doanh thu (VND)',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    yAxisID: 'yRevenue',
                    tension: 0.1,
                    fill: true,
                },
                // 1: Đơn hàng đã TT
                {
                    label: 'Đơn hàng (Đã TT)',
                    data: [],
                    borderColor: '#16a34a',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    yAxisID: 'yOrders', // Dùng chung trục y với "Tổng Đơn"
                    tension: 0.1,
                    fill: true,
                },
                // 2: Tổng Đơn Hàng
                {
                    label: 'Tổng Đơn Hàng',
                    data: [],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    yAxisID: 'yOrders',
                    tension: 0.1,
                    fill: true,
                    hidden: true, // Ẩn mặc định
                },
                // 3: Người Dùng Mới
                {
                    label: 'Người Dùng Mới',
                    data: [],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    yAxisID: 'yUsers', // Dùng trục Y riêng
                    tension: 0.1,
                    fill: true,
                    hidden: true, // Ẩn mặc định
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                // Trục Y 1: Doanh thu (VND)
                yRevenue: {
                    type: 'linear', position: 'left',
                    ticks: { callback: (value) => `${(value / 1000).toLocaleString('vi-VN')}k` },
                },
                // Trục Y 2: Đếm Đơn hàng
                yOrders: {
                    type: 'linear', position: 'right',
                    ticks: { stepSize: 1, precision: 0 },
                    grid: { drawOnChartArea: false },
                },
                // Trục Y 3: Đếm Người dùng
                yUsers: {
                    type: 'linear', position: 'right',
                    ticks: { stepSize: 1, precision: 0 },
                    grid: { drawOnChartArea: false },
                    display: false, // Ẩn trục này đi, nó sẽ tự hiện khi dataset 3 được bật
                },
                x: { ticks: { autoSkip: true, maxTicksLimit: 15 } }
            }
        }
    };

    // === Cấu hình Biểu đồ Tròn (Pie Chart) ===
    const pieChartConfig = {
        type: 'pie',
        data: {
            labels: ['COD', 'VNPAY'],
            datasets: [{
                data: [0, 0],
                backgroundColor: [ '#0ea5e9', '#f59e0b' ],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    };

    // === HÀM CHÍNH: Gọi API và Cập nhật toàn bộ UI ===
    async function fetchAndRenderCharts(startDate, endDate) {
        try {
            const params = new URLSearchParams({
                start: startDate.format('YYYY-MM-DD'),
                end: endDate.format('YYYY-MM-DD')
            });

            const res = await fetch(`/admin/api/chart-data?${params.toString()}`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            if (!res.ok) throw new Error('Không thể tải dữ liệu');
            
            const data = await res.json();
            
            // 1. Cập nhật Thẻ Thống kê
            const stats = data.aggregateStats;
            statOrders.textContent = stats.totalOrders.toLocaleString('vi-VN');
            statPaid.textContent = stats.totalPaid.toLocaleString('vi-VN');
            statCOD.textContent = stats.totalCOD.toLocaleString('vi-VN');
            statVNPAY.textContent = stats.totalVNPAY.toLocaleString('vi-VN');
            
            // 2. Cập nhật Biểu đồ Đường
            lineChartConfig.data.labels = data.labels;
            lineChartConfig.data.datasets[0].data = data.revenueData;
            lineChartConfig.data.datasets[1].data = data.paidOrdersData;
            lineChartConfig.data.datasets[2].data = data.totalOrdersData;
            lineChartConfig.data.datasets[3].data = data.newUsersData;
            
            if (revenueChartInstance) {
                revenueChartInstance.update();
            } else {
                revenueChartInstance = new Chart(lineChartCanvas, lineChartConfig);
            }

            // 3. Cập nhật Biểu đồ Tròn
            pieChartConfig.data.datasets[0].data = [stats.totalCOD, stats.totalVNPAY];
            
            if (pieChartInstance) {
                pieChartInstance.update();
            } else {
                pieChartInstance = new Chart(pieChartCanvas, pieChartConfig);
            }

        } catch (err) {
            console.error(err);
            lineChartCanvas.parentElement.innerHTML = '<p class="text-danger text-center">Không thể tải biểu đồ.</p>';
        }
    }

    // === KHỞI TẠO DATEPICKER ===
    const start = moment().subtract(29, 'days');
    const end = moment();
    const datePickerInput = $('#daterange-picker'); // jQuery ($)

    datePickerInput.daterangepicker({ /* ... (Giữ nguyên cấu hình daterangepicker từ bước trước) ... */
        startDate: start,
        endDate: end,
        ranges: {
           'Hôm nay': [moment(), moment()],
           'Hôm qua': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
           '7 ngày qua': [moment().subtract(6, 'days'), moment()],
           '30 ngày qua': [moment().subtract(29, 'days'), moment()],
           'Tháng này': [moment().startOf('month'), moment().endOf('month')],
           'Tháng trước': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        },
        locale: {
            format: 'DD/MM/YYYY', applyLabel: 'Áp dụng', cancelLabel: 'Hủy',
            customRangeLabel: 'Tùy chỉnh',
            daysOfWeek: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
            monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
        }
    });

    // Lắng nghe sự kiện thay đổi ngày
    datePickerInput.on('apply.daterangepicker', (ev, picker) => {
        fetchAndRenderCharts(picker.startDate, picker.endDate);
    });
    
    // === LẮNG NGHE SỰ KIỆN CHECKBOX ===
    document.getElementById('chart-toggles').addEventListener('change', (e) => {
        if (e.target.matches('input[type="checkbox"]')) {
            const index = e.target.value; // Lấy index (0, 1, 2, 3)
            const isVisible = revenueChartInstance.isDatasetVisible(index);
            revenueChartInstance.setDatasetVisibility(index, !isVisible);
            
            // Nếu bật/tắt dataset 3 (New Users), bật/tắt trục Y của nó
            if (index == 3) {
                 revenueChartInstance.options.scales.yUsers.display = !isVisible;
            }
            
            revenueChartInstance.update();
        }
    });

    // Tải biểu đồ lần đầu
    fetchAndRenderCharts(start, end);
});