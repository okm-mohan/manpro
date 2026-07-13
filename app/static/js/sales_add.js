// ======================================
// SALES ADD
// ======================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const rows = document.querySelectorAll("#salesBody tr");

        if (rows.length === 0) {
            addRow();
        } else {
            rows.forEach((row) => calculateRow(row.querySelector('[name="qty"]'), false));
            calculateTotals();
            updateItemCount();
        }

    }
);

// ======================================
// ADD ROW
// ======================================

function addRow() {

    let tbody =
        document.getElementById(
            "salesBody"
        );

    let row = `
<tr>

    <td>
        <select
            name="product_id"
            required
            onchange="productChanged(this)"
            class="form-control"
        >
            <option value="">Select Product</option>
            ${productsOptions}
        </select>
    </td>

    <td>
        <input
            type="number"
            name="qty"
            value="1"
            step="0.001"
            min="0.001"
            required
            onkeyup="calculateRow(this)"
            onchange="calculateRow(this)"
        >
    </td>

    <td>
        <input
            type="number"
            name="rate"
            value="0"
            step="0.01"
            min="0"
            required
            onkeyup="calculateRow(this)"
            onchange="calculateRow(this)"
        >
    </td>

    <td>
        <input
            type="number"
            name="gst_percent"
            value="0"
            step="0.01"
            min="0"
            onkeyup="calculateRow(this)"
            onchange="calculateRow(this)"
        >
    </td>

    <td>
        <input
            type="number"
            name="gst_amount"
            value="0"
            readonly
        >
    </td>

    <td>
        <input
            type="number"
            name="line_total"
            value="0"
            readonly
        >
    </td>

    <td>
        <button
            type="button"
            class="btn-remove"
            onclick="removeRow(this)"
        >
            <i class="bi bi-trash3"></i>
            <span class="visually-hidden">Remove item</span>
        </button>
    </td>

</tr>
`;

    tbody.insertAdjacentHTML(
        "beforeend",
        row
    );

    updateItemCount();
}

// ======================================
// PRODUCT CHANGED
// ======================================

function productChanged(select){

    let option =
        select.options[
            select.selectedIndex
        ];

    let row =
        select.closest("tr");

    row.querySelector(
        '[name="rate"]'
    ).value =
        option.dataset.rate || 0;

    row.querySelector(
        '[name="gst_percent"]'
    ).value =
        option.dataset.gst || 0;

    calculateRow(select);
}

// ======================================
// REMOVE ROW
// ======================================

function removeRow(btn){

    btn.closest("tr").remove();

    if (document.querySelectorAll("#salesBody tr").length === 0) {
        addRow();
    }

    calculateTotals();
    updateItemCount();
}

// ======================================
// CALCULATE ROW
// ======================================

function calculateRow(input, updateTotals = true){

    if (!input) return;

    let row =
        input.closest("tr");

    let qty =
        parseFloat(
            row.querySelector(
                '[name="qty"]'
            ).value
        ) || 0;

    let rate =
        parseFloat(
            row.querySelector(
                '[name="rate"]'
            ).value
        ) || 0;

    let gstPercent =
        parseFloat(
            row.querySelector(
                '[name="gst_percent"]'
            ).value
        ) || 0;

    let amount =
        qty * rate;

    let gstAmount =
        amount * gstPercent / 100;

    let lineTotal =
        amount + gstAmount;

    row.querySelector(
        '[name="gst_amount"]'
    ).value =
        gstAmount.toFixed(2);

    row.querySelector(
        '[name="line_total"]'
    ).value =
        lineTotal.toFixed(2);

    if (updateTotals) calculateTotals();
}

// ======================================
// CALCULATE TOTALS
// ======================================

function calculateTotals(){

    let subTotal = 0;
    let gstTotal = 0;
    let grandTotal = 0;

    document
    .querySelectorAll(
        '[name="qty"]'
    )
    .forEach(function(field){

        let row =
            field.closest("tr");

        let qty =
            parseFloat(
                row.querySelector(
                    '[name="qty"]'
                ).value
            ) || 0;

        let rate =
            parseFloat(
                row.querySelector(
                    '[name="rate"]'
                ).value
            ) || 0;

        let gst =
            parseFloat(
                row.querySelector(
                    '[name="gst_amount"]'
                ).value
            ) || 0;

        let total =
            parseFloat(
                row.querySelector(
                    '[name="line_total"]'
                ).value
            ) || 0;

        subTotal += qty * rate;
        gstTotal += gst;
        grandTotal += total;

    });

    document.getElementById(
        "subTotal"
    ).innerHTML =
        "\u20B9 " +
        subTotal.toFixed(2);

    document.getElementById(
        "gstTotal"
    ).innerHTML =
        "\u20B9 " +
        gstTotal.toFixed(2);

    document.getElementById(
        "grandTotal"
    ).innerHTML =
        "\u20B9 " +
        grandTotal.toFixed(2);
}

function updateItemCount() {
    const count = document.querySelectorAll("#salesBody tr").length;
    const label = document.getElementById("itemCount");

    if (label) {
        label.textContent = `${count} item${count === 1 ? "" : "s"}`;
    }
}


