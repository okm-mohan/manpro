document.addEventListener("DOMContentLoaded", function () {
    startClock();
    setGreeting();
    animateMoneyCounters();
    loadSalesChart();
});

function startClock() {
    const dateElement = document.getElementById("todayDate");
    const clockElement = document.getElementById("liveClock");

    function update() {
        const now = new Date();

        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            });
        }

        if (clockElement) {
            clockElement.textContent = now.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
        }
    }

    update();
    setInterval(update, 1000);
}

function setGreeting() {
    const hour = new Date().getHours();
    const heading = document.getElementById("dashboardGreeting");

    if (!heading) {
        return;
    }

    let greeting = "Good Evening";

    if (hour < 12) {
        greeting = "Good Morning";
    } else if (hour < 17) {
        greeting = "Good Afternoon";
    }

    heading.textContent = `${greeting}, Administrator`;
}

function animateMoneyCounters() {
    document.querySelectorAll("[data-counter]").forEach(function (element) {
        const target = Number(element.dataset.counter || 0);
        const steps = 36;
        const increment = target / steps;
        let current = 0;
        let tick = 0;

        const timer = setInterval(function () {
            tick += 1;
            current += increment;

            if (tick >= steps) {
                current = target;
                clearInterval(timer);
            }

            element.textContent = "\u20B9 " + Math.round(current).toLocaleString("en-IN");
        }, 18);
    });
}

function loadSalesChart() {
    const canvas = document.getElementById("salesChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    let labels = [];
    let values = [];

    try {
        labels = JSON.parse(canvas.dataset.labels || "[]");
        values = JSON.parse(canvas.dataset.values || "[]").map(Number);
    } catch (error) {
        labels = [];
        values = [];
    }

    if (!labels.length) {
        labels = ["No Data"];
        values = [0];
    }

    new Chart(canvas, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Sales",
                data: values,
                borderColor: "#0e7490",
                backgroundColor: "rgba(14,116,144,.12)",
                pointBackgroundColor: "#047857",
                pointBorderColor: "#ffffff",
                pointRadius: 4,
                borderWidth: 3,
                fill: true,
                tension: 0.35
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return "\u20B9 " + Number(context.parsed.y || 0).toLocaleString("en-IN");
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: "#64748b", font: { weight: "700" } }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: "rgba(148,163,184,.22)" },
                    ticks: {
                        color: "#64748b",
                        callback: function (value) {
                            return "\u20B9 " + Number(value).toLocaleString("en-IN");
                        }
                    }
                }
            }
        }
    });
}
