document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('quotCreateForm');
    const items = document.getElementById('itemsContainer');
    const formGrid = document.querySelector('.quot-form-grid');
    if (!form || !items || !formGrid) return;

    const headings = document.createElement('div');
    headings.className = 'quot-item-column-headings';
    headings.innerHTML = '<span>Product list</span><span>Description</span><span>Qty</span><span>Price</span><span>Discount</span><span>Total amount</span><span>Remove</span>';
    items.parentNode.insertBefore(headings, items);

    const gstField = document.createElement('label');
    gstField.className = 'quot-form-group gst-field';
    gstField.innerHTML = '<span>GST percentage</span><input type="number" id="gst_percentage" name="gst_percentage" value="0" min="0" max="100" step="0.01">';
    formGrid.appendChild(gstField);
    const gst = gstField.querySelector('input');

    function money(value) { return '₹ ' + value.toFixed(2); }
    function updateTotals() {
        let subtotal = 0;
        items.querySelectorAll('.quot-item-row').forEach(function (row) {
            const qty = parseFloat(row.querySelector('[name="quantity[]"]').value) || 0;
            const rate = parseFloat(row.querySelector('[name="rate[]"]').value) || 0;
            const discountInput = row.querySelector('[name="discount[]"]');
            const discount = discountInput ? (parseFloat(discountInput.value) || 0) : 0;
            const line = qty * rate * (1 - discount / 100);
            subtotal += line;
            const display = row.querySelector('.quot-item-line-total');
            if (display) display.textContent = money(line);
        });
        const discountPct = parseFloat(document.getElementById('discount_pct').value) || 0;
        const discountAmount = subtotal * discountPct / 100;
        const taxable = subtotal - discountAmount;
        const tax = taxable * (parseFloat(gst.value) || 0) / 100;
        const total = taxable + tax;
        document.getElementById('subtotalDisplay').textContent = money(subtotal);
        document.getElementById('discountDisplay').textContent = money(discountAmount);
        document.getElementById('taxDisplay').textContent = money(tax);
        document.getElementById('totalDisplay').textContent = money(total);
        document.getElementById('subtotalHidden').value = subtotal.toFixed(2);
        document.getElementById('discountHidden').value = discountAmount.toFixed(2);
        document.getElementById('taxHidden').value = tax.toFixed(2);
        document.getElementById('totalHidden').value = total.toFixed(2);
    }
    form.addEventListener('input', updateTotals);
    form.addEventListener('change', updateTotals);
    new MutationObserver(updateTotals).observe(items, { childList: true });
    updateTotals();
});
