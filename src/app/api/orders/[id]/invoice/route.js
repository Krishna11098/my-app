import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req, { params }) {
    try {
        const { id } = await params;

        const order = await prisma.rentalOrder.findUnique({
            where: { id },
            include: {
                lines: { include: { product: true } },
                customer: true,
                vendor: {
                    select: { 
                        id: true, 
                        name: true, 
                        companyName: true, 
                        companyLogo: true, 
                        gstin: true,
                        email: true,
                        phone: true
                    }
                },
                invoice: true,
                pickupAddress: true
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Get or create invoice
        let invoice = order.invoice;
        if (!invoice) {
            const invCount = await prisma.invoice.count();
            invoice = await prisma.invoice.create({
                data: {
                    orderId: order.id,
                    customerId: order.customerId,
                    vendorId: order.vendorId, // Link to vendor
                    invoiceNumber: `INV-${new Date().getFullYear()}-${(invCount + 1).toString().padStart(4, '0')}`,
                    status: order.amountPaid >= order.totalAmount ? 'PAID' : order.amountPaid > 0 ? 'PARTIAL' : 'DRAFT',
                    issueDate: new Date(),
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    subtotal: order.subtotal,
                    taxAmount: order.taxAmount,
                    totalAmount: order.totalAmount,
                    amountPaid: order.amountPaid,
                    securityDeposit: order.securityDeposit || 0
                }
            });
        }

        // Generate HTML Invoice
        const html = generateInvoiceHTML(order, invoice);

        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html',
            }
        });
    } catch (error) {
        console.error('Invoice Error:', error);
        return NextResponse.json({ error: 'Error generating invoice' }, { status: 500 });
    }
}

function generateInvoiceHTML(order, invoice) {
    const rentalDays = Math.ceil((new Date(order.rentalEnd) - new Date(order.rentalStart)) / (1000 * 60 * 60 * 24));
    const vendor = order.vendor;
    const vendorName = vendor?.companyName || vendor?.name || 'JOY JUNCTURE';
    const vendorLogo = vendor?.companyLogo;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f5f5f5; padding: 40px; }
        .invoice { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border-radius: 12px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e0e0e0; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #9333ea, #4f46e5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: flex; align-items: center; gap: 12px; }
        .logo img { height: 50px; width: auto; border-radius: 8px; }
        .invoice-title { text-align: right; }
        .invoice-title h1 { font-size: 32px; color: #1a1a1a; }
        .invoice-title p { color: #666; margin-top: 5px; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
        .meta-box h3 { font-size: 12px; text-transform: uppercase; color: #999; margin-bottom: 8px; letter-spacing: 1px; }
        .meta-box p { color: #333; line-height: 1.6; }
        .status { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .status-paid { background: #dcfce7; color: #166534; }
        .status-partial { background: #fef3c7; color: #92400e; }
        .status-draft { background: #e5e7eb; color: #374151; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f8f9fa; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #e0e0e0; }
        td { padding: 16px 12px; border-bottom: 1px solid #eee; }
        .item-name { font-weight: 600; color: #1a1a1a; }
        .item-type { font-size: 11px; padding: 3px 8px; border-radius: 12px; margin-left: 8px; }
        .type-rental { background: #f3e8ff; color: #7c3aed; }
        .type-sale { background: #dcfce7; color: #166534; }
        .text-right { text-align: right; }
        .totals { margin-top: 20px; display: flex; justify-content: flex-end; }
        .totals-box { width: 280px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .total-row.grand { border-top: 2px solid #1a1a1a; border-bottom: none; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: bold; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px; }
        .rental-period { background: #f8f9fa; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
        .rental-period span { color: #666; }
        .rental-period strong { color: #1a1a1a; }
        .vendor-info { background: #f8f9fa; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; }
        .vendor-info strong { color: #333; }
        @media print {
            body { padding: 0; background: white; }
            .invoice { box-shadow: none; }
            .no-print { display: none; }
        }
        .print-btn { position: fixed; bottom: 30px; right: 30px; background: linear-gradient(135deg, #9333ea, #4f46e5); color: white; border: none; padding: 15px 30px; border-radius: 30px; font-size: 16px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 15px rgba(147, 51, 234, 0.4); }
        .print-btn:hover { transform: translateY(-2px); }
    </style>
</head>
<body>
    <div class="invoice">
        <div class="header">
            <div class="logo">
                ${vendorLogo ? `<img src="${vendorLogo}" alt="${vendorName}" />` : ''}
                <span>${vendorName}</span>
            </div>
            <div class="invoice-title">
                <h1>INVOICE</h1>
                <p>${invoice.invoiceNumber}</p>
                <span class="status status-${invoice.status.toLowerCase()}">${invoice.status}</span>
            </div>
        </div>

        ${vendor ? `
        <div class="vendor-info">
            <strong>Sold By:</strong> ${vendorName}
            ${vendor.gstin ? ` | <strong>GSTIN:</strong> ${vendor.gstin}` : ''}
            ${vendor.email ? ` | ${vendor.email}` : ''}
            ${vendor.phone ? ` | ${vendor.phone}` : ''}
        </div>
        ` : ''}

        <div class="meta">
            <div class="meta-box">
                <h3>Bill To</h3>
                <p>
                    <strong>${order.customer.name}</strong><br>
                    ${order.customer.email}<br>
                    ${order.customer.companyName ? order.customer.companyName + '<br>' : ''}
                    ${order.customer.gstin ? 'GSTIN: ' + order.customer.gstin : ''}
                </p>
            </div>
            <div class="meta-box" style="text-align: right;">
                <h3>Invoice Details</h3>
                <p>
                    <strong>Order #:</strong> ${order.orderNumber}<br>
                    <strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString('en-IN')}<br>
                    <strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}
                </p>
            </div>
        </div>

        <div class="rental-period">
            <div>
                <span>Rental Period:</span>
                <strong>${new Date(order.rentalStart).toLocaleDateString('en-IN')} - ${new Date(order.rentalEnd).toLocaleDateString('en-IN')}</strong>
            </div>
            <div>
                <span>Duration:</span>
                <strong>${rentalDays} days</strong>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Type</th>
                    <th>Rental Period</th>
                    <th>Qty</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${order.lines.map(line => {
                    const lineStart = line.rentalStart || order.rentalStart;
                    const lineEnd = line.rentalEnd || order.rentalEnd;
                    const lineDays = Math.ceil((new Date(lineEnd) - new Date(lineStart)) / (1000 * 60 * 60 * 24));
                    return `
                    <tr>
                        <td class="item-name">${line.product.name}</td>
                        <td><span class="item-type ${line.type === 'SALE' ? 'type-sale' : 'type-rental'}">${line.type === 'SALE' ? 'Purchase' : 'Rental'}</span></td>
                        <td style="font-size: 12px; color: #666;">
                            ${line.type === 'SALE' ? '-' : `${new Date(lineStart).toLocaleDateString('en-IN')} to ${new Date(lineEnd).toLocaleDateString('en-IN')}<br><strong>${lineDays} days</strong>`}
                        </td>
                        <td>${line.quantity}</td>
                        <td class="text-right">₹${Number(line.unitPrice).toLocaleString('en-IN')}</td>
                        <td class="text-right">₹${Number(line.lineTotal).toLocaleString('en-IN')}</td>
                    </tr>
                `}).join('')}
            </tbody>
        </table>

        <div class="totals">
            <div class="totals-box">
                <div class="total-row">
                    <span>Subtotal</span>
                    <span>₹${Number(order.subtotal).toLocaleString('en-IN')}</span>
                </div>
                <div class="total-row">
                    <span>Tax (18% GST)</span>
                    <span>₹${Number(order.taxAmount).toLocaleString('en-IN')}</span>
                </div>
                ${order.securityDeposit > 0 ? `
                <div class="total-row">
                    <span>Security Deposit</span>
                    <span>₹${Number(order.securityDeposit).toLocaleString('en-IN')}</span>
                </div>
                ` : ''}
                <div class="total-row grand">
                    <span>Total</span>
                    <span>₹${Number(order.totalAmount).toLocaleString('en-IN')}</span>
                </div>
                <div class="total-row" style="color: #166534;">
                    <span>Amount Paid</span>
                    <span>₹${Number(order.amountPaid).toLocaleString('en-IN')}</span>
                </div>
                ${(order.totalAmount - order.amountPaid) > 0 ? `
                <div class="total-row" style="color: #dc2626;">
                    <span>Balance Due</span>
                    <span>₹${Number(order.totalAmount - order.amountPaid).toLocaleString('en-IN')}</span>
                </div>
                ` : ''}
            </div>
        </div>

        <div class="footer">
            <p>Thank you for choosing Joy Juncture!</p>
            <p style="margin-top: 8px;">For queries, contact support@joyjuncture.com</p>
        </div>
    </div>

    <button class="print-btn no-print" onclick="window.print()">🖨️ Print Invoice</button>
</body>
</html>
    `;
}
