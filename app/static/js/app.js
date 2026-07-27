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
                if (orderId) {
                    fetch("/hdfoods/orders/" + orderId + "/gst")
                        .then(response => response.ok ? response.json() : null)
                        .then(data => {
                            if (data && Number(data.gst_percent) > 0) {
                                const totalCell = row.children[5];
                                if (totalCell && !totalCell.querySelector(".gst-included-note")) {
                                    const note = document.createElement("small");
                                    note.className = "gst-included-note";
                                    note.textContent = "Incl. GST (" + data.gst_percent + "%)";
                                    totalCell.appendChild(note);
                                }
                            }
                        }).catch(() => {});
                }
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

    const liveOrderStages = [
        ["Order Placed", "Order Placed"], ["Processing", "Processing"],
        ["Ready for Dispatch", "Ready for Dispatch"], ["Out for Delivery", "Out for Delivery"],
        ["Delivered", "Delivered"], ["Payment Settled", "Payment Settled"]
    ];
    document.querySelectorAll('.live-table form[action$="/status"] select[name="status"]').forEach(function (select) {
        const legacy = select.value;
        const selected = legacy === "Ordered" ? "Order Placed" : legacy === "Pending Delivery" ? "Processing" : legacy;
        select.replaceChildren(...liveOrderStages.map(function (stage) {
            const option = new Option(stage[1], stage[0], false, stage[0] === selected);
            return option;
        }));
        select.onchange = async function () {
            const form = select.form;
            const previous = select.dataset.savedValue || selected;
            select.disabled = true;
            try {
                const response = await fetch(form.action + "?status=" + encodeURIComponent(select.value), {
                    method: "POST",
                    headers: { "X-Requested-With": "XMLHttpRequest" }
                });
                if (!response.ok) throw new Error("Status update failed");
                select.dataset.savedValue = select.value;
                select.classList.add("live-status-saved");
                setTimeout(() => select.classList.remove("live-status-saved"), 900);
            } catch (error) {
                select.value = previous;
                showLiveOrderNotice("The order status could not be updated. Please try again.", "error");
            } finally {
                select.disabled = false;
            }
        };
        select.dataset.savedValue = selected;
        const orderId = select.form.action.match(/orders\/(\d+)\/status/)?.[1];
        if (orderId) {
            fetch("/hdfoods/orders/" + orderId + "/status")
                .then(response => response.ok ? response.json() : null)
                .then(data => {
                    if (data && liveOrderStages.some(stage => stage[0] === data.status)) {
                        select.value = data.status;
                        select.dataset.savedValue = data.status;
                    }
                }).catch(() => {});
        }
    });

    const liveRegister = document.querySelector(".live-register");
    const liveTable = liveRegister && liveRegister.querySelector(".live-table table");
    if (liveRegister && liveTable && !document.getElementById("liveStatusFilter")) {
        const filter = document.createElement("select");
        filter.id = "liveStatusFilter";
        filter.className = "live-status-filter";
        filter.innerHTML = '<option value="">All statuses</option>' + liveOrderStages.map(stage => '<option value="' + stage[0] + '">' + stage[1] + '</option>').join('');
        const dateFilter = liveRegister.querySelector(".live-dates");
        if (dateFilter) dateFilter.prepend(filter);
        const applyFilter = function () {
            liveTable.querySelectorAll("tbody tr").forEach(function (row) {
                const select = row.querySelector('form[action$="/status"] select');
                if (!select) return;
                row.hidden = !!filter.value && select.value !== filter.value;
            });
        };
        filter.addEventListener("change", applyFilter);
        liveTable.querySelectorAll('form[action$="/status"] select').forEach(select => select.addEventListener("change", () => setTimeout(applyFilter, 50)));
    }

    function showLiveOrderNotice(message, kind) {
        let notice = document.getElementById("liveOrderNotice");
        if (!notice) {
            notice = document.createElement("div");
            notice.id = "liveOrderNotice";
            document.body.appendChild(notice);
        }
        notice.className = "live-order-notice " + kind;
        notice.textContent = message;
        notice.hidden = false;
        clearTimeout(notice._timer);
        notice._timer = setTimeout(() => { notice.hidden = true; }, 2800);
    }

    const liveOrdersPage = document.querySelector(".live-orders");
    const orderEntry = liveOrdersPage && liveOrdersPage.querySelector(".order-entry");
    const liveHero = liveOrdersPage && liveOrdersPage.querySelector(".live-hero");
    if (orderEntry && liveHero && !document.getElementById("liveOrderModal")) {
        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "live-new-order-btn";
        openButton.innerHTML = '<i class="bi bi-plus-lg"></i> New Order';
        liveHero.appendChild(openButton);
        const modal = document.createElement("dialog");
        modal.id = "liveOrderModal";
        modal.className = "live-order-modal";
        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "live-order-modal-close";
        closeButton.setAttribute("aria-label", "Close new order form");
        closeButton.innerHTML = '<i class="bi bi-x-lg"></i>';
        const orderForm = orderEntry.querySelector("form");
        const submitButton = orderForm && orderForm.querySelector('button[type="submit"], button:not([type])');
        if (orderForm && submitButton && !orderForm.querySelector(".live-order-cancel")) {
            const footer = document.createElement("div");
            footer.className = "live-order-modal-actions";
            const cancel = document.createElement("button");
            cancel.type = "button";
            cancel.className = "live-order-cancel";
            cancel.innerHTML = '<i class="bi bi-x-lg"></i> Cancel';
            submitButton.parentNode.insertBefore(footer, submitButton);
            footer.append(cancel, submitButton);
            cancel.addEventListener("click", () => modal.close());
            const total = orderEntry.querySelector("#liveTotal");
            if (total) {
                total.classList.add("live-order-footer-total");
                footer.insertBefore(total, footer.firstChild);
            }
        }
        modal.append(closeButton, orderEntry);
        document.body.appendChild(modal);
        const openLiveOrderModal = () => {
            const timeInput = orderEntry.querySelector('input[name="delivery_time"]');
            if (timeInput && !timeInput.value) timeInput.value = new Date().toTimeString().slice(0, 5);
            modal.showModal();
        };
        openButton.addEventListener("click", openLiveOrderModal);
        const orderParams = new URLSearchParams(window.location.search);
        if (orderParams.get("new") === "1") {
            const customerSelect = orderEntry.querySelector('select[name="customer_id"]');
            if (customerSelect && orderParams.get("customer_id")) customerSelect.value = orderParams.get("customer_id");
            openLiveOrderModal();
        }
        closeButton.addEventListener("click", () => modal.close());
        modal.addEventListener("click", event => { if (event.target === modal) modal.close(); });
    }

    document.querySelectorAll(".shops-table-wrap table").forEach(function (table) {
        const header = table.querySelector("thead tr");
        if (!header || header.dataset.statusColumns) return;
        header.dataset.statusColumns = "true";
        const actionsHeader = header.lastElementChild;
        ["Shop Status", "Order Status", "Edit"].forEach(function (label) { const th = document.createElement("th"); th.textContent = label; header.insertBefore(th, actionsHeader); });
        actionsHeader.textContent = "Order";
        table.querySelectorAll("tbody tr.shop-row").forEach(function (row) {
            const actionCell = row.lastElementChild, edit = actionCell.querySelector('a[href*="/customer/edit/"]'), order = actionCell.querySelector('a[href*="sales-orders/add"]');
            const customerId = edit && edit.href.match(/\/customer\/edit\/(\d+)/)?.[1];
            const active = document.createElement("td"); active.innerHTML = '<span class="shop-active-status">Active</span>';
            const orderStatus = document.createElement("td"); orderStatus.innerHTML = '<span class="shop-order-status">Loading…</span>';
            const editCell = document.createElement("td"); if (edit) editCell.append(edit);
            row.insertBefore(active, actionCell); row.insertBefore(orderStatus, actionCell); row.insertBefore(editCell, actionCell);
            if (order) actionCell.replaceChildren(order);
            if (order && customerId) order.href = "/hdfoods/orders?new=1&customer_id=" + encodeURIComponent(customerId);
            if (customerId) {
                active.innerHTML = '<select class="shop-status-select"><option>Active</option><option>Inactive</option></select>';
                const statusSelect = active.querySelector("select");
                statusSelect.addEventListener("change", () => fetch('/hdfoods/shops/' + customerId + '/status', {method:'POST', body:new URLSearchParams({status:statusSelect.value})}));
            }
            if (customerId) fetch('/hdfoods/shops/' + customerId + '/order-status').then(r => r.json()).then(data => { orderStatus.querySelector('span').textContent = data.status; }).catch(() => { orderStatus.querySelector('span').textContent = 'No orders'; });
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
