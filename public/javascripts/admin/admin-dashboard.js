// public/javascripts/admin-dashboard.js
document.addEventListener("DOMContentLoaded", () => {
    const ctxMain = document.getElementById("mainChart");
    const ctxPayment = document.getElementById("paymentChart");
    const ctxProduct = document.getElementById("productChart");
    const ctxCategory = document.getElementById("categoryChart");
    const ctxSentiment = document.getElementById("chartSentiment");

    if (!ctxMain) return;

    let mainChart, paymentChart, productChart, categoryChart, sentimentChart;
    let currentGroupBy = "year";

    // --- 1. CONFIG MAIN CHART (COMBO) ---
    const mainConfig = {
        type: "line",
        data: {
            labels: [],
            datasets: [
                {
                    label: "Doanh thu",
                    data: [],
                    borderColor: "#4e73df",
                    backgroundColor: "rgba(78, 115, 223, 0.05)",
                    yAxisID: "yMoney",
                    tension: 0.3,
                    fill: true,
                },
                {
                    label: "Lợi nhuận",
                    data: [],
                    borderColor: "#1cc88a",
                    backgroundColor: "rgba(28, 200, 138, 0.05)",
                    yAxisID: "yMoney",
                    tension: 0.3,
                    fill: true,
                    hidden: true,
                },
                {
                    label: "Đơn hàng",
                    data: [],
                    borderColor: "#36b9cc",
                    backgroundColor: "rgba(54, 185, 204, 0.05)",
                    yAxisID: "yCount",
                    tension: 0.3,
                },
                {
                    label: "User Mới",
                    data: [],
                    borderColor: "#f6c23e",
                    backgroundColor: "rgba(246, 194, 62, 0.05)",
                    yAxisID: "yCount",
                    tension: 0.3,
                    hidden: true,
                },
            ],
        },
        options: {
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            scales: {
                yMoney: {
                    type: "linear",
                    position: "left",
                    ticks: { callback: (v) => (v / 1000000).toFixed(1) + "M" },
                },
                yCount: {
                    type: "linear",
                    position: "right",
                    grid: { drawOnChartArea: false },
                    ticks: { precision: 0 },
                },
                x: { grid: { display: false } },
            },
            plugins: { legend: { display: false } },
        },
    };

    // --- 2. CONFIG PAYMENT CHART (PIE) ---
    const paymentConfig = {
        type: "doughnut",
        data: {
            labels: [
                "Thanh toán khi nhận hàng (COD)",
                "Thanh toán Online (VNPAY)",
            ],
            datasets: [
                {
                    data: [],
                    backgroundColor: ["#4e73df", "#1cc88a"],
                    hoverBackgroundColor: ["#2e59d9", "#17a673"],
                    hoverBorderColor: "rgba(234, 236, 244, 1)",
                },
            ],
        },
        options: {
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom" } },
            cutout: "70%",
        },
    };

    // --- 3. CONFIG PRODUCT CHART (HORIZ BAR) ---
    const productConfig = {
        type: "bar",
        data: {
            labels: [],
            datasets: [
                {
                    label: "Đã bán",
                    data: [],
                    backgroundColor: "#36b9cc",
                    borderRadius: 4,
                },
            ],
        },
        options: {
            indexAxis: "y",
            maintainAspectRatio: false,
            scales: { x: { beginAtZero: true } },
            plugins: { legend: { display: false } },
        },
    };

    // --- 4. CONFIG CATEGORY CHART (BAR) ---
    const categoryConfig = {
        type: "bar",
        data: {
            labels: [],
            datasets: [
                {
                    label: "Doanh thu",
                    data: [],
                    backgroundColor: "#f6c23e",
                    borderRadius: 4,
                },
            ],
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: (v) => (v / 1000000).toFixed(1) + "M" },
                },
            },
            plugins: { legend: { display: false } },
        },
    };

    // --- 5. CONFIG SENTIMENT CHART (DOUGHNUT - MỚI) ---
    const sentimentConfig = {
        type: "doughnut",
        data: {
            labels: [
                "Tích cực (Positive)",
                "Trung tính (Neutral)",
                "Tiêu cực (Negative)",
            ],
            datasets: [
                {
                    data: [],
                    backgroundColor: ["#1cc88a", "#858796", "#e74a3b"], // Xanh lá, Xám, Đỏ
                    hoverOffset: 4,
                },
            ],
        },
        options: {
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom" } },
            cutout: "60%",
        },
    };

    // --- HÀM FETCH DỮ LIỆU ---
    async function fetchData(start, end, groupBy) {
        try {
            const params = new URLSearchParams({
                start: start.format("YYYY-MM-DD"),
                end: end.format("YYYY-MM-DD"),
                groupBy: groupBy,
            });

            const res = await fetch(`/admin/api/chart-data?${params}`, {
                headers: { "X-Requested-With": "XMLHttpRequest" },
            });
            const data = await res.json();
            if (!data.ok) return;

            // Update Stats
            const fmt = (n) => (n || 0).toLocaleString("vi-VN");
            document.getElementById("stat-revenue").textContent =
                fmt(data.stats.totalRevenue) + "đ";
            document.getElementById("stat-profit").textContent =
                fmt(data.stats.totalProfit) + "đ";
            document.getElementById("stat-orders").textContent = fmt(
                data.stats.totalOrders
            );
            document.getElementById("stat-new-users").textContent = fmt(
                data.stats.newUsersInPeriod
            );
            document.getElementById("stat-total-users").textContent =
                "Tổng: " + fmt(data.stats.totalUsers);

            // Update Charts

            // 1. Main
            mainConfig.data.labels = data.charts.main.labels;
            mainConfig.data.datasets[0].data = data.charts.main.revenue;
            mainConfig.data.datasets[1].data = data.charts.main.profit;
            mainConfig.data.datasets[2].data = data.charts.main.orders;
            mainConfig.data.datasets[3].data = data.charts.main.newUsers;
            if (mainChart) mainChart.update();
            else mainChart = new Chart(ctxMain, mainConfig);

            // 2. Payment
            paymentConfig.data.datasets[0].data = data.charts.payment;
            if (paymentChart) paymentChart.update();
            else paymentChart = new Chart(ctxPayment, paymentConfig);

            // 3. Products
            productConfig.data.labels = data.charts.products.labels;
            productConfig.data.datasets[0].data = data.charts.products.data;
            if (productChart) productChart.update();
            else productChart = new Chart(ctxProduct, productConfig);

            // 4. Category
            categoryConfig.data.labels = data.charts.categories.labels;
            categoryConfig.data.datasets[0].data = data.charts.categories.data;
            if (categoryChart) categoryChart.update();
            else categoryChart = new Chart(ctxCategory, categoryConfig);

            // 5. Sentiment (BỔ SUNG)
            // API trả về data.charts.sentiment là mảng [Pos, Neu, Neg]
            sentimentConfig.data.datasets[0].data = data.charts.sentiment || [
                0, 0, 0,
            ];
            if (sentimentChart) sentimentChart.update();
            else sentimentChart = new Chart(ctxSentiment, sentimentConfig);
        } catch (err) {
            console.error(err);
        }
    }

    // --- INIT & EVENTS ---
    const picker = $("#daterange-picker");
    const ranges = {
        "Tuần này": [moment().startOf("week"), moment().endOf("week")],
        "Tháng này": [moment().startOf("month"), moment().endOf("month")],
        "Quý này": [moment().startOf("quarter"), moment().endOf("quarter")],
        "Năm nay": [moment().startOf("year"), moment().endOf("year")],
    };

    picker.daterangepicker(
        {
            startDate: moment().startOf("year"),
            endDate: moment().endOf("year"),
            ranges: ranges,
            locale: { format: "DD/MM/YYYY", customRangeLabel: "Tùy chọn" },
        },
        (start, end) => fetchData(start, end, currentGroupBy)
    );

    document.querySelectorAll("#time-filters button").forEach((btn) => {
        btn.addEventListener("click", () => {
            document
                .querySelectorAll("#time-filters button")
                .forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            currentGroupBy = btn.dataset.type;

            let start = moment().startOf(currentGroupBy);
            let end = moment().endOf(currentGroupBy);

            picker.data("daterangepicker").setStartDate(start);
            picker.data("daterangepicker").setEndDate(end);
            fetchData(start, end, currentGroupBy);
        });
    });

    const toggles = [
        { id: "tg-rev", idx: 0 },
        { id: "tg-prof", idx: 1 },
        { id: "tg-ord", idx: 2 },
        { id: "tg-user", idx: 3 },
    ];
    toggles.forEach((t) => {
        document.getElementById(t.id).addEventListener("change", (e) => {
            if (mainChart) {
                mainChart.setDatasetVisibility(t.idx, e.target.checked);
                mainChart.update();
            }
        });
    });

    fetchData(moment().startOf("year"), moment().endOf("year"), "year");
});
