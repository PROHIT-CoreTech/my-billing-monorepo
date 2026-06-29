import { BillingDocumentType } from '@my-billing/database';

export interface TemplateLineItem {
  description: string;
  specifications?: string; // Sub-text for specifications / serial numbers
  hsnSac?: string;         // HSN/SAC code, defaults to "998311"
  quantity: number;
  price: number;           // Rate
  per?: string;            // Unit, e.g., "nos", "pcs", defaults to "nos"
  discountPercent?: number; // Discount percentage, defaults to 0
  taxRate: number;         // GST % (e.g. 18 for 18%)
}

export interface TemplateClientInfo {
  name: string;
  email?: string;
  billingAddress?: string;
  billingAndShippingAddress?: string; // Unified address
  gstin?: string;
  stateName?: string;
  stateCode?: string;
}

export interface DocumentData {
  documentType: BillingDocumentType;
  documentNumber: string;
  issueDate: Date | string;
  dueDate?: Date | string;
  validUntil?: Date | string;
  clientInfo: TemplateClientInfo;
  items: TemplateLineItem[];
  notes?: string;
  currency?: string;
  applyGst?: boolean;      // Option to choose whether to apply GST or not (applies to Quotation and Proforma)
  bankDetails?: {
    accountName?: string;
    bankName?: string;
    accountType?: string;
    accountNumber?: string;
    ifscCode?: string;
    branch?: string;
  };
  terms?: string[];
  logoUrl?: string;
}

/**
 * Converts a number to Indian Currency words (Rupees and Paise)
 */
export function numberToWords(amount: number): string {
  const fraction = Math.round((amount % 1) * 100);
  let wholeAmount = Math.floor(amount);

  const singleDigits = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const doubleDigits = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const formatHundreds = (num: number): string => {
    let str = "";
    if (num >= 100) {
      str += singleDigits[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }
    if (num >= 10 && num < 20) {
      str += doubleDigits[num - 10] + " ";
    } else if (num >= 20) {
      str += tens[Math.floor(num / 10)] + " " + singleDigits[num % 10] + " ";
    } else if (num > 0) {
      str += singleDigits[num] + " ";
    }
    return str.trim();
  };

  if (wholeAmount === 0 && fraction === 0) return "Rupees Zero Only";

  let words = "";

  if (wholeAmount > 0) {
    // Crores
    if (wholeAmount >= 10000000) {
      const cr = Math.floor(wholeAmount / 10000000);
      words += formatHundreds(cr) + " Crore ";
      wholeAmount %= 10000000;
    }
    // Lakhs
    if (wholeAmount >= 100000) {
      const lakh = Math.floor(wholeAmount / 100000);
      words += formatHundreds(lakh) + " Lakh ";
      wholeAmount %= 100000;
    }
    // Thousands
    if (wholeAmount >= 1000) {
      const thousand = Math.floor(wholeAmount / 1000);
      words += formatHundreds(thousand) + " Thousand ";
      wholeAmount %= 1000;
    }
    // Remainder hundreds
    if (wholeAmount > 0) {
      words += formatHundreds(wholeAmount);
    }
    words = "Indian Rupees " + words.trim() + " Only";
  }

  // Handle Paise
  if (fraction > 0) {
    let paiseWords = "";
    if (fraction >= 10 && fraction < 20) {
      paiseWords = doubleDigits[fraction - 10];
    } else {
      paiseWords = tens[Math.floor(fraction / 10)] + " " + singleDigits[fraction % 10];
    }
    paiseWords = paiseWords.trim() + " Paise";

    if (words === "") {
      words = paiseWords + " Only";
    } else {
      words = words.replace(" Only", "") + " and " + paiseWords + " Only";
    }
  }

  return words;
}

// Scoped print-optimized styles matching the Tally ERP Invoice style sheet
const styles = `
/* Scoped print-optimized Tally ERP style layout */
body.tally-billing-body {
  font-family: "Arial", "Helvetica", sans-serif;
  color: #000;
  margin: 0;
  padding: 0;
  font-size: 10px;
  background-color: #fff;
  line-height: 1.25;
}

.tally-outer-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 10px;
  box-sizing: border-box;
}

.tally-invoice-grid {
  width: 100%;
  border-collapse: collapse;
  border: 1.5px solid #000;
}

.tally-invoice-grid td {
  border: 1px solid #000;
  padding: 5px;
  vertical-align: top;
  box-sizing: border-box;
}

/* Header title block */
.tally-main-title {
  text-align: center;
  font-weight: bold;
  font-size: 14px;
  text-transform: uppercase;
  padding: 5px 0;
  border-bottom: 1.5px solid #000;
}

/* Text formatting */
.tally-bold {
  font-weight: bold;
}

.tally-italic {
  font-style: italic;
}

.tally-text-right {
  text-align: right;
}

.tally-text-center {
  text-align: center;
}

.tally-uppercase {
  text-transform: uppercase;
}

.tally-small-text {
  font-size: 9px;
  color: #000;
}

/* Issuer and Client blocks */
.tally-issuer-details {
  font-size: 10px;
  line-height: 1.35;
}

.tally-company-name {
  font-size: 12px;
  font-weight: bold;
}

.tally-client-title {
  font-size: 9.5px;
  font-weight: bold;
  margin-bottom: 2px;
  text-decoration: underline;
}

.tally-meta-label {
  display: inline-block;
  width: 90px;
}

/* Meta grids on the right column */
.tally-meta-subtable {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
}

.tally-meta-subtable td {
  border: none;
  border-bottom: 1px solid #000;
  border-right: 1px solid #000;
  padding: 4px 6px;
  font-size: 9.5px;
  width: 50%;
}

.tally-meta-subtable td:last-child {
  border-right: none;
}

.tally-meta-subtable tr:last-child td {
  border-bottom: none;
}

/* Main Items Table styling */
.tally-items-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: -1px; /* Align border with parent grid */
}

.tally-items-table th, .tally-items-table td {
  border: 1px solid #000;
  padding: 4px 6px;
  font-size: 10px;
  vertical-align: top;
}

.tally-items-table th {
  font-weight: bold;
  background-color: #fff;
  text-align: center;
  font-size: 9.5px;
  padding: 6px 4px;
}

.tally-items-table tr.item-row td {
  border-top: none;
  border-bottom: none;
}

/* Maintain minimum height for items area to match Tally format */
.tally-items-table tr.spacer-row td {
  border-top: none;
  border-bottom: none;
  height: 160px;
}

.tally-items-table tr.tax-row td {
  border-top: none;
  border-bottom: none;
  padding-top: 2px;
  padding-bottom: 2px;
}

.tally-items-table tr.totals-row td {
  border-top: 1px solid #000;
  border-bottom: 1.5px solid #000;
  font-weight: bold;
  padding: 5px 6px;
}

.tally-item-specs {
  font-size: 9px;
  margin-top: 3px;
  margin-left: 10px;
  line-height: 1.3;
}

/* HSN Summary Tax table */
.tally-hsn-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: -1px;
}

.tally-hsn-table th, .tally-hsn-table td {
  border: 1px solid #000;
  padding: 3px 5px;
  font-size: 9.5px;
}

.tally-hsn-table th {
  font-weight: bold;
  text-align: center;
}

.tally-hsn-table tr.totals-row td {
  font-weight: bold;
}

/* Footer structure */
.tally-footer-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: -1px;
}

.tally-footer-table td {
  border: 1px solid #000;
  padding: 5px;
}

.tally-declaration-cell {
  width: 50%;
  font-size: 9px;
  line-height: 1.35;
}

.tally-bank-cell {
  width: 50%;
  font-size: 9.5px;
  line-height: 1.35;
}

.tally-bank-detail-row {
  display: flex;
  margin-bottom: 2px;
}

.tally-bank-detail-label {
  font-weight: bold;
  width: 110px;
  flex-shrink: 0;
  display: inline-block;
}

.tally-bank-detail-value {
  display: inline-block;
}

.tally-sign-off-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: -1px;
}

.tally-sign-off-table td {
  border: 1px solid #000;
  padding: 5px;
  width: 50%;
  height: 90px;
  vertical-align: top;
  position: relative;
}

.tally-bottom-center-text {
  text-align: center;
  font-size: 9px;
  margin-top: 8px;
  font-weight: bold;
  letter-spacing: 0.5px;
}

/* Print layout rules */
@media print {
  body.tally-billing-body {
    background-color: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .tally-outer-container {
    max-width: 100%;
    padding: 0;
  }

  .tally-invoice-grid, 
  .tally-items-table, 
  .tally-hsn-table, 
  .tally-footer-table,
  .tally-sign-off-table {
    page-break-inside: avoid;
  }

  @page {
    size: A4;
    margin: 8mm 10mm 10mm 10mm;
  }
}
`;

/**
 * Generates the fully populated HTML layout matching Tally ERP format
 */
export function generateDocumentHtml(data: DocumentData): string {
  // 1. Resolve Dynamic Headings
  let title = 'TAX INVOICE';
  if (data.documentType === 'QUOTATION') {
    title = 'QUOTATION';
  } else if (data.documentType === 'PROFORMA') {
    title = 'PROFORMA INVOICE';
  }

  // Format Dates
  const formatTextDate = (d?: Date | string): string => {
    if (!d) return '';
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    
    // Custom dated output like "24-Apr-26"
    const day = dateObj.getDate().toString().padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

  // Currency Formatting helper
  const currencySymbol = data.currency === 'INR' || !data.currency ? '₹' : data.currency;
  const formatAmount = (val: number): string => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Apply GST toggle
  const isQuotationOrProforma = data.documentType === 'QUOTATION' || data.documentType === 'PROFORMA';
  const shouldApplyGst = isQuotationOrProforma ? (data.applyGst !== false) : true;

  // 2. Perform Calculations
  let subtotal = 0;
  let totalTax = 0;
  let totalQty = 0;

  // Group by HSN/SAC for the Tax summary table
  const hsnGroups: { 
    [hsn: string]: { 
      taxableValue: number; 
      taxRate: number; 
      cgstAmount: number; 
      sgstAmount: number; 
      totalTax: number; 
    } 
  } = {};

  const clientStateCode = data.clientInfo.stateCode || '';
  const isIntraState = clientStateCode === '27' || clientStateCode.trim() === '';

  // Process item rows
  const itemRowsHtml = data.items.map((item, index) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.price) || 0;
    const hsn = item.hsnSac || '998311';
    const per = item.per || 'nos';
    const discPct = Number(item.discountPercent) || 0;
    const taxRate = shouldApplyGst ? (Number(item.taxRate) || 0) : 0;

    const baseValue = qty * rate;
    const discountAmt = baseValue * (discPct / 100);
    const taxableValue = baseValue - discountAmt;
    const itemTax = taxableValue * (taxRate / 100);

    subtotal += taxableValue;
    totalTax += itemTax;
    totalQty += qty;

    // Build HSN group summary
    if (!hsnGroups[hsn]) {
      hsnGroups[hsn] = {
        taxableValue: 0,
        taxRate: taxRate,
        cgstAmount: 0,
        sgstAmount: 0,
        totalTax: 0
      };
    }
    hsnGroups[hsn].taxableValue += taxableValue;
    hsnGroups[hsn].cgstAmount += isIntraState ? (itemTax / 2) : 0;
    hsnGroups[hsn].sgstAmount += isIntraState ? (itemTax / 2) : 0;
    hsnGroups[hsn].totalTax += itemTax;

    return `
      <tr class="item-row">
        <td class="tally-text-center" style="border-right: 1px solid #000;">${index + 1}</td>
        <td style="border-right: 1px solid #000;">
          <div class="tally-bold">${escapeHtml(item.description)}</div>
          ${item.specifications ? `<div class="tally-item-specs">${item.specifications.replace(/\n/g, '<br>')}</div>` : ''}
        </td>
        <td class="tally-text-center" style="border-right: 1px solid #000;">${escapeHtml(hsn)}</td>
        <td class="tally-text-center tally-bold" style="border-right: 1px solid #000;">${qty} ${escapeHtml(per)}</td>
        <td class="tally-text-right" style="border-right: 1px solid #000;">${formatAmount(rate)}</td>
        <td class="tally-text-center" style="border-right: 1px solid #000;">${escapeHtml(per)}</td>
        <td class="tally-text-center" style="border-right: 1px solid #000;">${discPct > 0 ? `${discPct.toFixed(3)} %` : ''}</td>
        <td class="tally-text-right tally-bold">${formatAmount(taxableValue)}</td>
      </tr>
    `;
  }).join('');

  // Generate tax calculation rows inside items section
  let taxCalculationRowsHtml = '';
  if (shouldApplyGst && totalTax > 0) {
    // Find representative tax rate to display
    const taxRateLabel = getTaxPercentLabel(data.items, true);
    const cgstAmount = totalTax / 2;
    const sgstAmount = totalTax / 2;

    if (isIntraState) {
      taxCalculationRowsHtml += `
        <tr class="tax-row">
          <td style="border-right: 1px solid #000;"></td>
          <td class="tally-text-right tally-bold" style="border-right: 1px solid #000; padding-right: 25px;">OUTPUT CGST @ ${taxRateLabel}%</td>
          <td style="border-right: 1px solid #000;"></td>
          <td style="border-right: 1px solid #000;"></td>
          <td style="border-right: 1px solid #000;"></td>
          <td style="border-right: 1px solid #000;"></td>
          <td class="tally-text-center" style="border-right: 1px solid #000;">${taxRateLabel} %</td>
          <td class="tally-text-right tally-bold">${formatAmount(cgstAmount)}</td>
        </tr>
        <tr class="tax-row">
          <td style="border-right: 1px solid #000;"></td>
          <td class="tally-text-right tally-bold" style="border-right: 1px solid #000; padding-right: 25px;">OUTPUT SGST @ ${taxRateLabel}%</td>
          <td style="border-right: 1px solid #000;"></td>
          <td style="border-right: 1px solid #000;"></td>
          <td style="border-right: 1px solid #000;"></td>
          <td style="border-right: 1px solid #000;"></td>
          <td class="tally-text-center" style="border-right: 1px solid #000;">${taxRateLabel} %</td>
          <td class="tally-text-right tally-bold">${formatAmount(sgstAmount)}</td>
        </tr>
      `;
    } else {
      const fullTaxRateLabel = getTaxPercentLabel(data.items, false);
      taxCalculationRowsHtml += `
        <tr class="tax-row">
          <td style="border-right: 1px solid #000;"></td>
          <td class="tally-text-right tally-bold" style="border-right: 1px solid #000; padding-right: 25px;">OUTPUT IGST @ ${fullTaxRateLabel}%</td>
          <td style="border-right: 1px solid #000;"></td>
          <td style="border-right: 1px solid #000;"></td>
          <td style="border-right: 1px solid #000;"></td>
          <td style="border-right: 1px solid #000;"></td>
          <td class="tally-text-center" style="border-right: 1px solid #000;">${fullTaxRateLabel} %</td>
          <td class="tally-text-right tally-bold">${formatAmount(totalTax)}</td>
        </tr>
      `;
    }
  }

  // Calculate final totals
  const totalBeforeRound = subtotal + totalTax;
  const grandTotal = Math.round(totalBeforeRound);
  const roundOff = grandTotal - totalBeforeRound;

  // Add Round Off Row if needed
  let roundOffRowHtml = '';
  if (Math.abs(roundOff) > 0.001) {
    const formattedRoundOff = formatAmount(roundOff);
    const signLabel = roundOff < 0 ? '(-)' : '';
    roundOffRowHtml = `
      <tr class="tax-row">
        <td style="border-right: 1px solid #000;"></td>
        <td class="tally-italic" style="border-right: 1px solid #000;">Less: Round Off</td>
        <td style="border-right: 1px solid #000;"></td>
        <td style="border-right: 1px solid #000;"></td>
        <td style="border-right: 1px solid #000;"></td>
        <td style="border-right: 1px solid #000;"></td>
        <td style="border-right: 1px solid #000;"></td>
        <td class="tally-text-right tally-bold">${signLabel}${formatAmount(Math.abs(roundOff))}</td>
      </tr>
    `;
  }

  // Determine standard bank details
  const bank = data.bankDetails || {
    accountName: 'Cashflow Solutions',
    bankName: 'YES BANK',
    accountType: 'Current A/C',
    accountNumber: '021261900003481',
    ifscCode: 'YESB0000212',
    branch: 'Kandivali East, Thakur Village'
  };

  // Determine standard PAN from GSTIN (GSTIN structure: 27ALQPB3481K1ZR, PAN is characters 3 to 12 -> ALQPB3481K)
  const companyPan = 'ALQPB3481K'; 

  // Dynamic Terms & Declarations
  const termsList = data.terms || [
    'Goods once sold will not be taken back or exchanged.',
    'Payment not received within due date, interest @ 24% P.A. will be charged on Total Bill Value.',
    'Rupees 500/- will be Charged on Dishonour of Cheque.',
    'Warranty on all Products will be directly by ASP or their Importers.'
  ];
  const termsHtml = termsList.map(term => `<li>${escapeHtml(term)}</li>`).join('');

  // Text representation in words
  const totalInWords = numberToWords(grandTotal);

  // Address rendering
  const clientAddress = data.clientInfo.billingAndShippingAddress || data.clientInfo.billingAddress || 'N/A';

  // HSN Tax table rows
  let hsnTableRowsHtml = '';
  let hsnTotalsTaxable = 0;
  let hsnTotalsCgst = 0;
  let hsnTotalsSgst = 0;
  let hsnTotalsIgst = 0;
  let hsnTotalsTotal = 0;

  Object.keys(hsnGroups).forEach(hsn => {
    const group = hsnGroups[hsn];
    hsnTotalsTaxable += group.taxableValue;
    hsnTotalsTotal += group.totalTax;

    if (isIntraState) {
      hsnTotalsCgst += group.cgstAmount;
      hsnTotalsSgst += group.sgstAmount;
      hsnTableRowsHtml += `
        <tr>
          <td>${escapeHtml(hsn)}</td>
          <td class="tally-text-right">${formatAmount(group.taxableValue)}</td>
          <td class="tally-text-center">${(group.taxRate / 2)}%</td>
          <td class="tally-text-right">${formatAmount(group.cgstAmount)}</td>
          <td class="tally-text-center">${(group.taxRate / 2)}%</td>
          <td class="tally-text-right">${formatAmount(group.sgstAmount)}</td>
          <td class="tally-text-right">${formatAmount(group.totalTax)}</td>
        </tr>
      `;
    } else {
      hsnTotalsIgst += group.totalTax;
      hsnTableRowsHtml += `
        <tr>
          <td>${escapeHtml(hsn)}</td>
          <td class="tally-text-right">${formatAmount(group.taxableValue)}</td>
          <td class="tally-text-center">${group.taxRate}%</td>
          <td class="tally-text-right">${formatAmount(group.totalTax)}</td>
          <td class="tally-text-right">${formatAmount(group.totalTax)}</td>
        </tr>
      `;
    }
  });

  const taxAmountInWords = numberToWords(totalTax);

  // Build the complete Tally ERP dynamic page
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${escapeHtml(data.documentNumber)}</title>
  <style>
    ${styles}
  </style>
</head>
<body class="tally-billing-body">
  <div class="tally-outer-container">
    
    <!-- Title Center Header -->
    <div class="tally-main-title">${title}</div>

    <table class="tally-invoice-grid">
      <!-- Top Grid: Issuer & Meta Details -->
      <tr>
        <td style="width: 50%; height: 110px;">
          <!-- Primary Issuer Details (Tally style top left) -->
          <div class="tally-issuer-details">
            <div class="tally-company-name" style="font-size: 13px; display: flex; align-items: center; gap: 6px; margin-bottom: 5px;">
              ${data.logoUrl ? `<img src="${data.logoUrl}" alt="Logo" style="height: 16px; width: 16px; object-fit: contain; display: inline-block; vertical-align: middle;" onError="this.style.display='none';" />` : ''}
              CASHFLOW DETAILS
            </div>
            <div class="tally-small-text">Proprietor: Naresh Pandurang Bhuvad</div>
            <div>
              2b/706, 7th Floor, N.G. Suncity Phase II CHS,<br>
              Thakur Village Road, Kandivali East,<br>
              Mumbai, Maharashtra - 400101
            </div>
            <div style="margin-top: 4px;">
              <strong>GSTIN/UIN:</strong> 27ALQPB3481K1ZR<br>
              <strong>State Name:</strong> Maharashtra, <strong>Code:</strong> 27
            </div>
          </div>
        </td>
        <td style="width: 50%; padding: 0;" rowspan="2">
          <!-- Metadata Table (Tally style top right grid) -->
          <table class="tally-meta-subtable">
            <tr>
              <td>
                <div class="tally-small-text">Invoice No.</div>
                <div class="tally-bold">${escapeHtml(data.documentNumber)}</div>
              </td>
              <td>
                <div class="tally-small-text">Dated</div>
                <div class="tally-bold">${formatTextDate(data.issueDate)}</div>
              </td>
            </tr>
            <tr>
              <td>
                <div class="tally-small-text">Delivery Note</div>
                <div class="tally-bold">-</div>
              </td>
              <td>
                <div class="tally-small-text">Mode/Terms of Payment</div>
                <div class="tally-bold">-</div>
              </td>
            </tr>
            <tr>
              <td>
                <div class="tally-small-text">Reference No. & Date.</div>
                <div class="tally-bold">-</div>
              </td>
              <td>
                <div class="tally-small-text">Other References</div>
                <div class="tally-bold">-</div>
              </td>
            </tr>
            <tr>
              <td>
                <div class="tally-small-text">Buyer's Order No.</div>
                <div class="tally-bold">-</div>
              </td>
              <td>
                <div class="tally-small-text">Dated</div>
                <div class="tally-bold">-</div>
              </td>
            </tr>
            <tr>
              <td>
                <div class="tally-small-text">Dispatch Doc No.</div>
                <div class="tally-bold">-</div>
              </td>
              <td>
                <div class="tally-small-text">Delivery Note Date</div>
                <div class="tally-bold">-</div>
              </td>
            </tr>
            <tr>
              <td>
                <div class="tally-small-text">Dispatched through</div>
                <div class="tally-bold">-</div>
              </td>
              <td>
                <div class="tally-small-text">Destination</div>
                <div class="tally-bold">-</div>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="height: 60px;">
                <div class="tally-small-text">Terms of Delivery</div>
                <div class="tally-bold">-</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Combined Client Block (Tally style left mid) -->
      <tr>
        <td style="height: 200px;">
          <div class="tally-client-title">Buyer (Bill to) & Consignee (Ship to)</div>
          <div class="tally-bold" style="font-size: 11px; margin-top: 4px;">${escapeHtml(data.clientInfo.name)}</div>
          <div style="margin-top: 3px; line-height: 1.35;">${escapeHtml(clientAddress).replace(/\n/g, '<br>')}</div>
          <div style="margin-top: 8px; line-height: 1.35;">
            <strong>GSTIN/UIN:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${data.clientInfo.gstin ? escapeHtml(data.clientInfo.gstin) : 'N/A'}<br>
            <strong>State Name:</strong> &nbsp;&nbsp;&nbsp;&nbsp;: ${data.clientInfo.stateName || 'N/A'}, Code : ${data.clientInfo.stateCode || 'N/A'}
          </div>
        </td>
      </tr>

      <!-- Full-Width Items Table Area -->
      <tr>
        <td colspan="2" style="padding: 0; border: none;">
          <table class="tally-items-table">
            <thead>
              <tr>
                <th style="width: 5%;">SI<br>No.</th>
                <th style="width: 42%;">Description of Goods</th>
                <th style="width: 10%;">HSN/SAC</th>
                <th style="width: 10%;">Quantity</th>
                <th style="width: 10%;">Rate</th>
                <th style="width: 5%;">per</th>
                <th style="width: 8%;">Disc. %</th>
                <th style="width: 10%;">Amount</th>
              </tr>
            </thead>
            <tbody>
              
              <!-- Item rows -->
              ${itemRowsHtml}

              <!-- Spacer Row to push totals down -->
              <tr class="spacer-row">
                <td style="border-right: 1px solid #000;"></td>
                <td style="border-right: 1px solid #000;"></td>
                <td style="border-right: 1px solid #000;"></td>
                <td style="border-right: 1px solid #000;"></td>
                <td style="border-right: 1px solid #000;"></td>
                <td style="border-right: 1px solid #000;"></td>
                <td style="border-right: 1px solid #000;"></td>
                <td></td>
              </tr>

              <!-- Tax and Rounding rows -->
              ${taxCalculationRowsHtml}
              ${roundOffRowHtml}

              <!-- Bottom Totals row -->
              <tr class="totals-row">
                <td style="border-right: 1px solid #000;"></td>
                <td class="tally-text-right" style="border-right: 1px solid #000; padding-right: 20px;">Total</td>
                <td style="border-right: 1px solid #000;"></td>
                <td class="tally-text-center" style="border-right: 1px solid #000;">${totalQty} nos</td>
                <td style="border-right: 1px solid #000;"></td>
                <td style="border-right: 1px solid #000;"></td>
                <td style="border-right: 1px solid #000;"></td>
                <td class="tally-text-right">${currencySymbol} ${formatAmount(grandTotal)}</td>
              </tr>

            </tbody>
          </table>
        </td>
      </tr>

      <!-- Amount Chargeable block -->
      <tr>
        <td colspan="2" style="border-top: none;">
          <div style="float: right;" class="tally-bold">E. & O.E</div>
          <div>Amount Chargeable (in words)</div>
          <div class="tally-bold" style="font-size: 11px; margin-top: 2px;">${totalInWords}</div>
        </td>
      </tr>

      <!-- Dynamic GST Summary Table Block -->
      ${shouldApplyGst && totalTax > 0 ? `
      <tr>
        <td colspan="2" style="padding: 0;">
          <table class="tally-hsn-table">
            <thead>
              ${isIntraState ? `
              <tr>
                <th rowspan="2" style="width: 15%;">HSN/SAC</th>
                <th rowspan="2" style="width: 15%;">Taxable<br>Value</th>
                <th colspan="2" style="width: 25%;">Central Tax</th>
                <th colspan="2" style="width: 25%;">State Tax</th>
                <th rowspan="2" style="width: 20%;">Total<br>Tax Amount</th>
              </tr>
              <tr>
                <th>Rate</th>
                <th>Amount</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
              ` : `
              <tr>
                <th rowspan="2" style="width: 20%;">HSN/SAC</th>
                <th rowspan="2" style="width: 20%;">Taxable<br>Value</th>
                <th colspan="2" style="width: 40%;">Integrated Tax</th>
                <th rowspan="2" style="width: 20%;">Total<br>Tax Amount</th>
              </tr>
              <tr>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
              `}
            </thead>
            <tbody>
              ${hsnTableRowsHtml}
              <tr class="totals-row">
                <td class="tally-bold">Total</td>
                <td class="tally-text-right tally-bold">${formatAmount(hsnTotalsTaxable)}</td>
                ${isIntraState ? `
                <td></td>
                <td class="tally-text-right tally-bold">${formatAmount(hsnTotalsCgst)}</td>
                <td></td>
                <td class="tally-text-right tally-bold">${formatAmount(hsnTotalsSgst)}</td>
                ` : `
                <td></td>
                <td class="tally-text-right tally-bold">${formatAmount(hsnTotalsIgst)}</td>
                `}
                <td class="tally-text-right tally-bold">${formatAmount(hsnTotalsTotal)}</td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="border-top: none;">
          <div>Tax Amount (in words) : <span class="tally-bold">${taxAmountInWords}</span></div>
        </td>
      </tr>
      ` : ''}

      <!-- VAT/PAN Declarations & Bank Details Grid -->
      <tr>
        <td colspan="2" style="padding: 0; border: none;">
          <table class="tally-footer-table">
            <tr>
              <!-- PAN & Declaration details -->
              <td class="tally-declaration-cell" style="border-top: none; border-left: none; border-bottom: none;">
                <div style="margin-bottom: 5px;">
                  <strong>Company's PAN</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: &nbsp;&nbsp;<strong>${companyPan}</strong>
                </div>
                <div class="tally-bold" style="text-decoration: underline; margin-bottom: 2px;">Declaration:</div>
                <ul style="margin: 0; padding-left: 12px;">
                  ${termsHtml}
                </ul>
              </td>
              <!-- Hardcoded Bank details -->
              <td class="tally-bank-cell" style="border-top: none; border-right: none; border-bottom: none;">
                <div class="tally-bold" style="margin-bottom: 3px;">Company's Bank Details:</div>
                <div class="tally-bank-detail-row">
                  <span class="tally-bank-detail-label">A/c Holder's Name</span>
                  <span class="tally-bank-detail-value">: ${escapeHtml(bank.accountName || '')}</span>
                </div>
                <div class="tally-bank-detail-row">
                  <span class="tally-bank-detail-label">Bank Name</span>
                  <span class="tally-bank-detail-value">: ${escapeHtml(bank.bankName || '')}</span>
                </div>
                <div class="tally-bank-detail-row">
                  <span class="tally-bank-detail-label">A/c No.</span>
                  <span class="tally-bank-detail-value">: ${escapeHtml(bank.accountNumber || '')}</span>
                </div>
                <div class="tally-bank-detail-row">
                  <span class="tally-bank-detail-label">Branch & IFS Code</span>
                  <span class="tally-bank-detail-value">: ${escapeHtml(bank.branch || '')} & ${escapeHtml(bank.ifscCode || '')}</span>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Sign-off & Seal section -->
      <tr>
        <td colspan="2" style="padding: 0; border: none;">
          <table class="tally-sign-off-table">
            <tr>
              <td style="border-bottom: none; border-left: none;">
                <div class="tally-small-text">Customer's Seal and Signature</div>
              </td>
              <td style="border-bottom: none; border-right: none; text-align: right;">
                <div class="tally-bold" style="font-size: 9px; margin-bottom: 25px;">for CASHFLOW DETAILS</div>
                <div style="position: absolute; bottom: 5px; right: 10px;" class="tally-bold">Authorised Signatory</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

    </table>

    <div class="tally-bottom-center-text">SUBJECT TO MUMBAI JURISDICTION</div>
    <div style="text-align: center; font-size: 8.5px; margin-top: 2px;">This is a Computer Generated Invoice</div>

  </div>
</body>
</html>`;
}

/**
 * Basic HTML escaping helper to prevent script injection in generated output
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Gets a representative tax rate label from the items
 */
function getTaxPercentLabel(items: TemplateLineItem[], split: boolean): string {
  if (items.length === 0) return '0';
  
  const rates = items.map(i => i.taxRate);
  const maxRate = Math.max(...rates);
  
  return split ? (maxRate / 2).toString() : maxRate.toString();
}
