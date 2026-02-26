// ===== HELPERS =====
function randomHSN() {
    return String(Math.floor(10000000 + Math.random() * 90000000));
}

// ===== DEFAULT ITEMS DATA =====
const defaultItems = [
    {
        name: "PVC FOAM BOARD 7 MM",
        hsn: randomHSN(),
        qty: 2,
        unit: "NOS",
        rate: 1186.44,
        sgstPct: 9,
        cgstPct: 9
    },
    {
        name: "WELDING RAD DR. WELD 2.5 (50PCS)",
        hsn: randomHSN(),
        qty: 0.10,
        unit: "PKT",
        rate: 338.98,
        sgstPct: 9,
        cgstPct: 9
    },
    {
        name: "CUTTING WHEEL 4\" AP",
        hsn: randomHSN(),
        qty: 2,
        unit: "NOS",
        rate: 12.71,
        sgstPct: 9,
        cgstPct: 9
    }
];

let items = JSON.parse(JSON.stringify(defaultItems));

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
    renderEditor();
    updateBill();

    document.getElementById("inv-date").addEventListener("change", updateBill);
    document.getElementById("inv-no").addEventListener("input", updateBill);
});

// ===== RENDER EDITOR ITEM CARDS =====
function renderEditor() {
    const container = document.getElementById("items-container");
    container.innerHTML = "";

    items.forEach((item, i) => {
        const card = document.createElement("div");
        card.className = "item-card";
        card.innerHTML = `
            <div class="item-number">Item ${i + 1}</div>
            ${items.length > 1 ? `<button class="btn-remove" onclick="removeItem(${i})" title="Remove">✕</button>` : ""}
            <div class="field-row">
                <label>Name</label>
                <input type="text" value="${escapeHtml(item.name)}" oninput="updateItem(${i},'name',this.value)">
            </div>
            <div class="field-row">
                <label>Qty</label>
                <input type="number" step="0.01" value="${item.qty}" oninput="updateItem(${i},'qty',parseFloat(this.value)||0)">
            </div>
            <div class="field-row">
                <label>Unit</label>
                <select onchange="updateItem(${i},'unit',this.value)">
                    <option ${item.unit === "NOS" ? "selected" : ""}>NOS</option>
                    <option ${item.unit === "PKT" ? "selected" : ""}>PKT</option>
                    <option ${item.unit === "KG" ? "selected" : ""}>KG</option>
                    <option ${item.unit === "MTR" ? "selected" : ""}>MTR</option>
                    <option ${item.unit === "LTR" ? "selected" : ""}>LTR</option>
                    <option ${item.unit === "BOX" ? "selected" : ""}>BOX</option>
                    <option ${item.unit === "SET" ? "selected" : ""}>SET</option>
                    <option ${item.unit === "PCS" ? "selected" : ""}>PCS</option>
                </select>
            </div>
            <div class="field-row">
                <label>Rate</label>
                <input type="number" step="0.01" value="${item.rate}" oninput="updateItem(${i},'rate',parseFloat(this.value)||0)">
            </div>
            <div class="field-row">
                <label>Tax %</label>
                <input type="number" step="0.5" value="${item.sgstPct + item.cgstPct}" oninput="updateTax(${i},parseFloat(this.value)||0)">
            </div>
        `;
        container.appendChild(card);
    });
}

// ===== ITEM MANAGEMENT =====
function addItem() {
    items.push({
        name: "",
        hsn: randomHSN(),
        qty: 1,
        unit: "NOS",
        rate: 0,
        sgstPct: 9,
        cgstPct: 9
    });
    renderEditor();
    updateBill();
}

function removeItem(index) {
    if (items.length <= 1) return;
    items.splice(index, 1);
    renderEditor();
    updateBill();
}

function updateItem(index, field, value) {
    items[index][field] = value;
    updateBill();
}

function updateTax(index, totalPct) {
    items[index].sgstPct = totalPct / 2;
    items[index].cgstPct = totalPct / 2;
    updateBill();
}

// ===== UPDATE BILL PREVIEW =====
function updateBill() {
    // Date
    const dateInput = document.getElementById("inv-date").value;
    const dateObj = new Date(dateInput);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dateStr = `${dateObj.getDate().toString().padStart(2, "0")}-${months[dateObj.getMonth()]}-${dateObj.getFullYear()}`;
    document.getElementById("bill-date").textContent = dateStr;

    // Invoice No
    document.getElementById("bill-invno").textContent = document.getElementById("inv-no").value;

    // Items table
    const tbody = document.getElementById("bill-items-body");
    tbody.innerHTML = "";

    let totalTaxable = 0;
    let totalSGST = 0;
    let totalCGST = 0;
    let totalAmount = 0;
    const taxGroups = {};

    items.forEach((item, i) => {
        const taxable = item.rate * item.qty;
        const sgstAmt = taxable * (item.sgstPct / 100);
        const cgstAmt = taxable * (item.cgstPct / 100);
        const lineTotal = taxable + sgstAmt + cgstAmt;
        const roundedTotal = Math.round(lineTotal * 100) / 100;

        totalTaxable += taxable;
        totalSGST += sgstAmt;
        totalCGST += cgstAmt;
        totalAmount += roundedTotal;

        // Group by tax %
        const taxKey = item.sgstPct + item.cgstPct;
        if (!taxGroups[taxKey]) {
            taxGroups[taxKey] = { taxable: 0, cgst: 0, sgst: 0 };
        }
        taxGroups[taxKey].taxable += taxable;
        taxGroups[taxKey].cgst += cgstAmt;
        taxGroups[taxKey].sgst += sgstAmt;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td class="item-name-cell">${escapeHtml(item.name)}</td>
            <td>${item.hsn}</td>
            <td>${item.qty.toFixed(2)}</td>
            <td>${item.unit}</td>
            <td>${item.rate.toFixed(2)}</td>
            <td>${item.sgstPct.toFixed(2)}</td>
            <td>${sgstAmt.toFixed(2)}</td>
            <td>${item.cgstPct.toFixed(2)}</td>
            <td>${cgstAmt.toFixed(2)}</td>
            <td>${roundedTotal.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });

    // Add empty rows to fill space (min 8 total rows)
    const emptyRows = Math.max(0, 8 - items.length);
    for (let i = 0; i < emptyRows; i++) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>`;
        tbody.appendChild(tr);
    }

    // Totals
    const roundedBill = Math.round(totalAmount);
    const roundOff = roundedBill - totalAmount;

    document.getElementById("bill-roundoff").textContent = roundOff.toFixed(2);
    document.getElementById("bill-subtotal").textContent = totalAmount.toFixed(2);
    document.getElementById("bill-pretotal").textContent = totalAmount.toFixed(2);
    document.getElementById("bill-taxamt").textContent = (totalSGST + totalCGST).toFixed(2);
    document.getElementById("bill-cgsttotal").textContent = totalCGST.toFixed(2);
    document.getElementById("bill-sgsttotal").textContent = totalSGST.toFixed(2);
    document.getElementById("bill-grandtotal").textContent = roundedBill.toFixed(2);

    // Tax summary rows
    const taxBody = document.getElementById("bill-tax-body");
    taxBody.innerHTML = "";
    for (const key in taxGroups) {
        const g = taxGroups[key];
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${key}%</strong></td>
            <td>${g.taxable.toFixed(2)}</td>
            <td>${g.cgst.toFixed(2)}</td>
            <td>${g.sgst.toFixed(2)}</td>
        `;
        taxBody.appendChild(tr);
    }

    // Amount in words
    document.getElementById("bill-words").textContent =
        `Rupees ${numberToWords(roundedBill)} only...`;
}

// ===== PDF DOWNLOAD =====
function downloadPDF() {
    const bill = document.getElementById("bill");
    const opt = {
        margin: 0,
        filename: `Invoice_${document.getElementById("inv-no").value.replace(/\\/g, "_")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };
    html2pdf().set(opt).from(bill).save();
}

// ===== NUMBER TO WORDS =====
function numberToWords(num) {
    if (num === 0) return "Zero";

    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    function convertGroup(n) {
        if (n === 0) return "";
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
        return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convertGroup(n % 100) : "");
    }

    // Indian numbering system
    let result = "";
    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;

    if (crore) result += convertGroup(crore) + " Crore ";
    if (lakh) result += convertGroup(lakh) + " Lakh ";
    if (thousand) result += convertGroup(thousand) + " Thousand ";
    if (hundred) result += ones[hundred] + " Hundred ";
    if (remainder) result += convertGroup(remainder);

    return result.trim();
}

// ===== HELPERS =====
function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}
