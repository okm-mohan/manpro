document.addEventListener("DOMContentLoaded", function () {

    const liveOrderPrice = document.getElementById("livePrice");
    if (liveOrderPrice) {
        liveOrderPrice.readOnly = false;
        liveOrderPrice.addEventListener("input", function () {
            const quantity = document.getElementById("liveQty");
            if (quantity) quantity.dispatchEvent(new Event("input", { bubbles: true }));
        });
    }

    document.querySelectorAll(".live-table table").forEach(function (table) {
        const heading = table.querySelector("thead tr");
        if (!heading || heading.dataset.enhanced) return;
        heading.dataset.enhanced = "true";
        const headers = heading.children;
        if (headers.length >= 8) {
            const priceHeading = document.createElement("th");
            priceHeading.textContent = "Price";
            heading.insertBefore(priceHeading, headers[4]);
            headers[5].textContent = "Total Amount";
        }
        table.querySelectorAll("tbody tr").forEach(function (row) {
            const cells = row.children;
            if (cells.length < 8) return;
            const quantity = parseFloat(cells[3].textContent) || 0;
            const total = parseFloat(cells[4].textContent.replace(/[^0-9.]/g, "")) || 0;
            const priceCell = document.createElement("td");
            priceCell.textContent = quantity ? "₹ " + (total / quantity).toFixed(2) : "—";
            row.insertBefore(priceCell, cells[4]);
            const statusForm = row.querySelector('form[action$="/status"]');
            if (statusForm) {
                const orderId = statusForm.action.match(/orders\/(\d+)\/status/)?.[1];
                const modeCell = row.children[7];
                const currentMode = modeCell.textContent.trim();
                const modeForm = document.createElement("form");
                modeForm.method = "post";
                modeForm.action = "/hdfoods/orders/" + orderId + "/mode";
                modeForm.innerHTML = '<select name="delivery_mode"><option>Daily</option><option>Weekly</option><option>15 Days</option><option>30 Days</option><option>Custom</option></select>';
                const select = modeForm.querySelector("select");
                Array.from(select.options).forEach(o => o.selected = o.value === currentMode);
                select.addEventListener("change", () => modeForm.submit());
                modeCell.replaceChildren(modeForm);
            }
        });
    });

    let current = window.location.pathname.toLowerCase();

    const matchingMenuLinks = Array.from(document.querySelectorAll(".menu-list a")).filter(function(link){
        return new URL(link.href).pathname.toLowerCase() === current;
    });

    // A route can appear in more than one menu item. Highlight only the first
    // matching item so the current page always has one clear active state.
    if (matchingMenuLinks.length) {
        matchingMenuLinks[0].classList.add("active");
    }

    // Keep the containing expandable sidebar group open for the active page.
    document.querySelectorAll(".menu-group a.active").forEach(function (link) {
        const group = link.closest("details");
        if (group) group.open = true;
    });

    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menuToggle");
    const backdrop = document.getElementById("sidebarBackdrop");
    const mobileBreakpoint = 991;

    // Each page load recreates the fixed sidebar at scroll position 0. Keep the
    // currently selected menu item visible without moving the main page.
    const activeMenuLink = sidebar && sidebar.querySelector(".menu-list a.active");
    if (sidebar && activeMenuLink) {
        requestAnimationFrame(function () {
            const linkTop = activeMenuLink.getBoundingClientRect().top - sidebar.getBoundingClientRect().top + sidebar.scrollTop;
            const targetTop = Math.max(0, linkTop - (sidebar.clientHeight - activeMenuLink.offsetHeight) / 2);
            sidebar.scrollTo({ top: targetTop, behavior: "auto" });
        });
    }

    function setSidebar(open) {
        if (!sidebar || !menuToggle || !backdrop) return;

        sidebar.classList.toggle("is-open", open);
        backdrop.classList.toggle("is-visible", open);
        document.body.classList.toggle("sidebar-open", open);
        menuToggle.setAttribute("aria-expanded", String(open));
        menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");

        const icon = menuToggle.querySelector("i");
        if (icon) {
            icon.className = open ? "bi bi-x-lg" : "bi bi-list";
        }
    }

    if (menuToggle) {
        menuToggle.addEventListener("click", function () {
            setSidebar(!sidebar.classList.contains("is-open"));
        });
    }

    if (backdrop) {
        backdrop.addEventListener("click", function () {
            setSidebar(false);
        });
    }

    if (sidebar) {
        sidebar.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                if (window.innerWidth <= mobileBreakpoint) setSidebar(false);
            });
        });
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") setSidebar(false);
    });

    const routeToggle = document.getElementById("showRoutes");
    if (routeToggle) {
        routeToggle.innerHTML = '<i class="bi bi-bezier2"></i><span>Hide today travelled routes</span>';
        routeToggle.addEventListener("click", function () {
            const label = routeToggle.querySelector("span");
            if (label) label.textContent = routeToggle.classList.contains("off")
                ? "Hide today travelled routes"
                : "Show today travelled routes";
        });
    }

    window.addEventListener("resize", function () {
        if (window.innerWidth > mobileBreakpoint) setSidebar(false);
    });

});
document.addEventListener('click', function (event) {
    const button = event.target.closest('#fitTeam');
    if (!button) return;
    const shell = button.closest('.team-map-shell');
    if (!shell) return;
    if (document.fullscreenElement) {
        document.exitFullscreen?.();
    } else {
        shell.requestFullscreen?.().then(() => {
            setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const map = document.getElementById('teamMap');
    if (!map) return;
    const routes = [...map.querySelectorAll('path.leaflet-interactive')];
    const pins = [...map.querySelectorAll('.leaflet-marker-icon.person-marker')];
    pins.forEach((pin, index) => {
        const route = routes[index];
        const match = route?.getAttribute('d')?.match(/M\s*([\d.]+)[ ,]([\d.]+)/);
        const finalPosition = pin.style.transform;
        if (!match || !finalPosition) return;
        pin.style.transition = 'none';
        pin.style.transform = `translate3d(${match[1]}px, ${match[2]}px, 0px)`;
        requestAnimationFrame(() => requestAnimationFrame(() => {
            pin.style.transition = `transform 1800ms cubic-bezier(.22,.82,.24,1) ${index * 120}ms`;
            pin.style.transform = finalPosition;
        }));
    });
});
