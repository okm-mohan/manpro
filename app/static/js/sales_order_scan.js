document.addEventListener("DOMContentLoaded", () => {
    const input = document.querySelector('[name="order_scan"]');
    if (!input) return;

    input.addEventListener("change", async () => {
        const file = input.files && input.files[0];
        if (!file || !file.type.startsWith("image/")) return;
        const note = input.parentElement.querySelector("small");
        if (note) note.textContent = "Reading scan and filling PO details…";
        const formData = new FormData();
        formData.append("order_scan", file);
        try {
            const response = await fetch("/sales-orders/scan", { method: "POST", body: formData });
            const result = await response.json();
            if (!response.ok) throw new Error(result.detail || "Could not read this scan.");
            document.querySelector('[name="customer_po_number"]').value = result.customer_po_number || "";
            document.querySelector('[name="customer_po_date"]').value = result.customer_po_date || "";
            document.querySelector('[name="expected_delivery_date"]').value = result.expected_delivery_date || "";
            if (result.customer_name) {
                const customer = document.querySelector('[name="customer_id"]');
                const match = [...customer.options].find((option) => option.text.trim().toLowerCase() === result.customer_name.trim().toLowerCase());
                if (match) customer.value = match.value;
            }
            if (note) note.textContent = "Scan read successfully. Please confirm the filled details before saving.";
        } catch (error) {
            if (note) note.textContent = error.message || "The scan will still be attached when you save the order.";
        }
    });
});
