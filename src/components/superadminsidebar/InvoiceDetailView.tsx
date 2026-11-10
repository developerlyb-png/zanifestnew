"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/components/superadminsidebar/Invoice.module.css";
import { toast } from "react-hot-toast";
import {
  FiArrowLeft,
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiEdit2,
  FiFileText,
  FiMail,
  FiMoreVertical,
  FiTrash2,
  FiTruck,
  FiUpload,
  FiUsers,
  FiCreditCard,
  FiPlus,
  FiX,
} from "react-icons/fi";
import { INVOICE_STATUSES, invoiceStatusColor } from "@/constants/invoice";

interface Props {
  invoiceId: string;
  onBack: () => void;
  onEdit: () => void;
}

const inr = (n?: number) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";
const addrLine = (a?: { line1?: string; line2?: string; city?: string; state?: string; pincode?: string }) =>
  a ? [a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(", ") || "—" : "—";

const esc = (v: any) =>
  String(v ?? "—").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigitsToWords(n: number): string {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
}
function threeDigitsToWords(n: number): string {
  if (n >= 100) return ONES[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + twoDigitsToWords(n % 100) : "");
  return twoDigitsToWords(n);
}
// Indian numbering (crore/lakh/thousand), used for the "Amount in Words" line
// that a GST tax invoice is conventionally expected to carry.
function numberToWordsIndian(value: number): string {
  let n = Math.round(Math.abs(value));
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 1e7);
  n %= 1e7;
  const lakh = Math.floor(n / 1e5);
  n %= 1e5;
  const thousand = Math.floor(n / 1e3);
  n %= 1e3;
  const hundred = n;
  const parts: string[] = [];
  if (crore) parts.push(threeDigitsToWords(crore) + " Crore");
  if (lakh) parts.push(threeDigitsToWords(lakh) + " Lakh");
  if (thousand) parts.push(threeDigitsToWords(thousand) + " Thousand");
  if (hundred) parts.push(threeDigitsToWords(hundred));
  return parts.join(" ") || "Zero";
}
const amountInWords = (n?: number) => `Rupees ${numberToWordsIndian(n || 0)} Only`;

function Section({
  icon,
  title,
  sub,
  defaultOpen,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className={styles.sectionCard}>
      <button type="button" className={styles.sectionHead} onClick={() => setOpen((o) => !o)}>
        <span className={styles.sectionHeadIcon}>{icon}</span>
        <span>
          <div className={styles.sectionHeadTitle}>{title}</div>
          <div className={styles.sectionHeadSub}>{sub}</div>
        </span>
        <span className={styles.sectionHeadRight}>{open ? <FiChevronUp /> : <FiChevronDown />}</span>
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  );
}

const Row = ({ k, v }: { k: string; v?: React.ReactNode }) => (
  <div className={styles.infoRow} style={{ marginBottom: 12 }}>
    <span className={styles.infoKey}>{k}</span>
    <span className={styles.infoVal}>{v || "—"}</span>
  </div>
);

export default function InvoiceDetailView({ invoiceId, onBack, onEdit }: Props) {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");
  const [paymentNote, setPaymentNote] = useState("");
  const [recordingPayment, setRecordingPayment] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/invoices?id=${invoiceId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setInvoice(d.success ? d.invoice : null))
      .catch(() => setInvoice(null))
      .finally(() => setLoading(false));
  };

  useEffect(load, [invoiceId]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const updateStatus = async (status: string) => {
    setInvoice((prev: any) => ({ ...prev, status }));
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: invoiceId, status }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
      load();
    }
  };

  const deleteInvoice = async () => {
    if (!window.confirm(`Delete invoice ${invoice.invoiceNo}? This cannot be undone.`)) return;
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: invoiceId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Invoice deleted");
      onBack();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete invoice");
    }
  };

  const downloadReport = () => {
    const w = window.open("", "_blank");
    if (!w) return toast.error("Allow pop-ups to download the invoice");

    const seller = invoice.seller || {};
    const client = invoice.client || {};
    const clientAddr = addrLine({
      line1: client.addressLine1,
      line2: client.addressLine2,
      city: client.city,
      state: client.state,
      pincode: client.pincode,
    });

    const discountCell = (it: any) => {
      const v = Number(it.discountValue) || 0;
      if (!v) return "—";
      return it.discountType === "%" ? `${v}%` : inr(v);
    };
    const rows = (invoice.lineItems || [])
      .map(
        (it: any, i: number) =>
          `<tr><td>${i + 1}</td><td>${esc(it.description)}</td><td>${esc(it.hsnSac)}</td><td class="num">${it.qty}</td><td class="num">${inr(it.rate)}</td><td class="num">${discountCell(it)}</td><td class="num">${inr(it.amount)}</td></tr>`
      )
      .join("");
    const taxRows = (invoice.taxBreakup || [])
      .map((t: any) => `<tr><td>${esc(t.type)} (${(t.ratePercent ?? 0).toFixed(1)}%)</td><td class="num">${inr(t.amount)}</td></tr>`)
      .join("");

    const logoImg = seller.companyLogo?.data ? `<img class="logo" src="${seller.companyLogo.data}" />` : "";
    const sigImg = seller.principalOfficerSignature?.data || seller.signatureImage?.data;

    const bankBlock = seller.showBankDetailsOnInvoice && seller.bank?.accountNumber
      ? `<div class="bankBox">
          <div class="label">Bank Details</div>
          <div>${esc(seller.bank?.bankName)}${seller.bank?.branch ? ", " + esc(seller.bank.branch) : ""}</div>
          <div>A/C Name: ${esc(seller.bank?.accountName)}</div>
          <div>A/C No.: ${esc(seller.bank?.accountNumber)} &nbsp;·&nbsp; IFSC: ${esc(seller.bank?.ifscCode)}</div>
        </div>`
      : "";

    w.document.write(`<!doctype html><html><head><title>Invoice ${esc(invoice.invoiceNo)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111827; padding: 32px; max-width: 860px; margin: 0 auto; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111827; padding-bottom: 16px; }
  .headLeft { display: flex; gap: 14px; align-items: flex-start; }
  .logo { width: 56px; height: 56px; object-fit: contain; }
  .coName { font-size: 19px; font-weight: 800; }
  .muted { color: #4b5563; font-size: 12px; line-height: 1.5; }
  .headRight { text-align: right; }
  .title { font-size: 20px; font-weight: 800; letter-spacing: 0.04em; margin-bottom: 8px; }
  .metaRow { font-size: 12px; display: flex; justify-content: flex-end; gap: 8px; }
  .metaRow span:first-child { color: #6b7280; }
  .billRow { display: flex; justify-content: space-between; margin-top: 20px; gap: 24px; }
  .billBox { font-size: 12.5px; line-height: 1.6; max-width: 48%; }
  .label { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 700; margin-bottom: 4px; }
  .billName { font-size: 14px; font-weight: 700; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 22px; }
  table.items th, table.items td { border: 1px solid #d1d5db; padding: 7px 9px; font-size: 12px; text-align: left; }
  table.items th { background: #f3f4f6; font-weight: 700; }
  .num { text-align: right; }
  .bottomRow { display: flex; justify-content: space-between; margin-top: 16px; gap: 24px; align-items: flex-start; }
  .words { font-size: 12px; max-width: 54%; }
  .wordsVal { font-weight: 700; margin-top: 2px; }
  .bankBox { font-size: 11.5px; margin-top: 14px; line-height: 1.6; }
  table.totals { border-collapse: collapse; min-width: 260px; }
  table.totals td { padding: 5px 10px; font-size: 12.5px; }
  table.totals td:last-child { text-align: right; }
  table.totals tr.grand td { border-top: 2px solid #111827; font-weight: 800; font-size: 14px; padding-top: 8px; }
  .signRow { display: flex; justify-content: flex-end; margin-top: 46px; }
  .signBox { text-align: center; font-size: 12px; min-width: 220px; }
  .sig { max-height: 54px; max-width: 180px; object-fit: contain; display: block; margin: 0 auto 4px; }
  .sigBlank { height: 54px; }
  .signLine { border-top: 1px solid #111827; margin-top: 4px; padding-top: 4px; }
  .foot { margin-top: 36px; text-align: center; font-size: 11px; color: #9ca3af; }
  @media print { body { padding: 10mm; } }
</style></head><body>

<div class="head">
  <div class="headLeft">
    ${logoImg}
    <div>
      <div class="coName">${esc(seller.companyName)}</div>
      <div class="muted">${esc(addrLine(seller.registeredAddress))}</div>
      <div class="muted">GSTIN: ${esc(seller.gstin)} &nbsp;·&nbsp; PAN: ${esc(seller.pan)}</div>
      <div class="muted">${seller.email ? esc(seller.email) : ""}${seller.phone ? " · " + esc(seller.phone) : ""}</div>
    </div>
  </div>
  <div class="headRight">
    <div class="title">TAX INVOICE</div>
    <div class="metaRow"><span>Invoice No.&nbsp;</span><b>${esc(invoice.invoiceNo)}</b></div>
    <div class="metaRow"><span>Invoice Date&nbsp;</span><b>${esc(fmtDate(invoice.invoiceDate))}</b></div>
    ${invoice.dueDate ? `<div class="metaRow"><span>Due Date&nbsp;</span><b>${esc(fmtDate(invoice.dueDate))}</b></div>` : ""}
    <div class="metaRow"><span>Place of Supply&nbsp;</span><b>${esc(invoice.placeOfSupply)}</b></div>
    <div class="metaRow"><span>Status&nbsp;</span><b>${esc(invoice.status)}</b></div>
    ${invoice.reverseCharge ? `<div class="metaRow"><span>Reverse Charge&nbsp;</span><b>Yes</b></div>` : ""}
  </div>
</div>

<div class="billRow">
  <div class="billBox">
    <div class="label">Bill To</div>
    <div class="billName">${esc(client.name)}</div>
    ${client.contactPerson ? `<div>${esc(client.contactPerson)}</div>` : ""}
    <div>${esc(clientAddr)}</div>
    <div>GSTIN: ${esc(client.gstin)} &nbsp;·&nbsp; PAN: ${esc(client.pan)}</div>
    ${client.email || client.phone ? `<div>${client.email ? esc(client.email) : ""}${client.phone ? " · " + esc(client.phone) : ""}</div>` : ""}
  </div>
  <div class="billBox">
    <div class="label">Tax Mode</div>
    <div>${invoice.taxMode === "INTRA" ? "Intra State (CGST + SGST)" : "Inter State (IGST)"}</div>
  </div>
</div>

<table class="items">
  <thead><tr><th>#</th><th>Description</th><th>HSN/SAC</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Discount</th><th class="num">Amount</th></tr></thead>
  <tbody>${rows}</tbody>
</table>

<div class="bottomRow">
  <div class="words">
    <div class="label">Amount in Words</div>
    <div class="wordsVal">${esc(amountInWords(invoice.grandTotal))}</div>
    ${bankBlock}
  </div>
  <table class="totals">
    <tr><td>Taxable Amount</td><td>${inr(invoice.subtotal)}</td></tr>
    ${taxRows}
    <tr><td>Total Tax</td><td>${inr(invoice.totalTax)}</td></tr>
    <tr class="grand"><td>Grand Total</td><td>${inr(invoice.grandTotal)}</td></tr>
    ${(invoice.payments || []).length > 0 ? `<tr><td>Received</td><td>${inr(invoice.amountReceived)}</td></tr><tr><td>Balance Due</td><td>${inr(invoice.balanceDue ?? invoice.grandTotal)}</td></tr>` : ""}
  </table>
</div>

<div class="signRow">
  <div class="signBox">
    <div>For ${esc(seller.companyName)}</div>
    ${sigImg ? `<img class="sig" src="${sigImg}" />` : `<div class="sigBlank"></div>`}
    <div class="signLine">${esc(seller.principalOfficerName || seller.contactPerson)}<br/>Authorized Signatory</div>
  </div>
</div>

<div class="foot">This is a computer-generated invoice.</div>

<script>window.onload=function(){window.print()}</script></body></html>`);
    w.document.close();
    setMenuOpen(false);
  };

  const uploadSignedPdf = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf") return toast.error("Please upload a PDF file");
    if (file.size > 8 * 1024 * 1024) return toast.error("File is too large (max 8MB)");
    setBusy(true);
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const res = await fetch("/api/admin/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: invoiceId, signedPdf: { data, fileName: file.name } }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Signed PDF uploaded");
      setInvoice(json.invoice);
    } catch (e: any) {
      toast.error(e.message || "Failed to upload signed PDF");
    } finally {
      setBusy(false);
      setMenuOpen(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const sendEmail = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/invoices/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: invoiceId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(`Emailed to ${invoice.client?.email}`);
      setInvoice(json.invoice);
    } catch (e: any) {
      toast.error(e.message || "Failed to send email");
    } finally {
      setBusy(false);
      setMenuOpen(false);
    }
  };

  const recordPayment = async () => {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return toast.error("Enter a valid payment amount");
    setRecordingPayment(true);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: invoiceId,
          addPayment: { date: paymentDate, amount, mode: paymentMode, note: paymentNote },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Payment recorded");
      setInvoice(data.invoice);
      setShowPaymentForm(false);
      setPaymentAmount("");
      setPaymentNote("");
    } catch (e: any) {
      toast.error(e.message || "Failed to record payment");
    } finally {
      setRecordingPayment(false);
    }
  };

  const removePayment = async (paymentId: string) => {
    if (!window.confirm("Remove this payment entry?")) return;
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: invoiceId, removePaymentId: paymentId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Payment removed");
      setInvoice(data.invoice);
    } catch (e: any) {
      toast.error(e.message || "Failed to remove payment");
    }
  };

  if (loading) return <div className={styles.detailWrap}>Loading invoice...</div>;
  if (!invoice) {
    return (
      <div className={styles.detailWrap}>
        <button className={styles.backLink} onClick={onBack}>
          <FiArrowLeft /> Back to invoices
        </button>
        <p>Invoice not found.</p>
      </div>
    );
  }

  const statusColor = invoiceStatusColor(invoice.status);

  return (
    <div className={styles.detailWrap}>
      <button className={styles.backLink} onClick={onBack}>
        <FiArrowLeft /> Back to invoices
      </button>

      <div className={styles.detailHeader}>
        <div className={styles.detailHeadLeft}>
          <span className={styles.detailIcon}>
            <FiFileText />
          </span>
          <div>
            <div className={styles.invoiceNo}>{invoice.invoiceNo}</div>
            <div className={styles.invoiceDate}>{fmtDate(invoice.invoiceDate)}</div>
            <div className={styles.statusRow}>
              <select
                className={styles.statusPill}
                style={{ background: statusColor.bg, color: statusColor.fg, border: "none" }}
                value={invoice.status}
                onChange={(e) => updateStatus(e.target.value)}
              >
                {INVOICE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <span className={styles.taxModePill}>{invoice.taxMode === "INTRA" ? "Intra State (INTRA)" : "Inter State (INTER)"}</span>
            </div>
          </div>
        </div>

        <div className={styles.detailActions}>
          <button type="button" className={styles.editBtn} onClick={onEdit}>
            <FiEdit2 /> Edit
          </button>
          <div className={styles.actionsWrap} ref={menuRef}>
            <button type="button" className={styles.actionsBtn} onClick={() => setMenuOpen((v) => !v)} disabled={busy}>
              <FiMoreVertical /> Actions
            </button>
            {menuOpen && (
              <div className={styles.actionsMenu}>
                <button type="button" className={styles.actionsItem} onClick={downloadReport}>
                  <FiDownload /> Download PDF
                </button>
                <button type="button" className={styles.actionsItem} onClick={() => fileRef.current?.click()}>
                  <FiUpload /> Upload Signed PDF
                </button>
                <button type="button" className={styles.actionsItem} onClick={sendEmail}>
                  <FiMail /> Send Email
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={(e) => uploadSignedPdf(e.target.files?.[0])} />
          </div>
          <button type="button" className={styles.deleteBtn} onClick={deleteInvoice}>
            <FiTrash2 /> Delete
          </button>
        </div>
      </div>

      <div className={styles.detailCols}>
        <div className={styles.detailMain}>
          <Section icon={<FiTruck />} title="Seller Information" sub={invoice.seller?.companyName} defaultOpen>
            <div className={styles.infoGrid}>
              <Row k="Company Name" v={invoice.seller?.companyName} />
              <Row k="Contact Person" v={invoice.seller?.contactPerson} />
              <Row k="Email" v={invoice.seller?.email} />
              <Row k="Phone" v={invoice.seller?.phone} />
              <Row k="Registered Address" v={addrLine(invoice.seller?.registeredAddress)} />
              <Row
                k="Corporate Address"
                v={invoice.seller?.useRegisteredAsCorporate ? "Same as Registered Address" : addrLine(invoice.seller?.corporateAddress)}
              />
              <Row k="GSTIN" v={invoice.seller?.gstin} />
              <Row k="PAN" v={invoice.seller?.pan} />
            </div>
          </Section>

          <Section icon={<FiUsers />} title="Client Information" sub={invoice.client?.name}>
            <div className={styles.infoGrid}>
              <Row k="Client Name" v={invoice.client?.name} />
              <Row k="Contact Person" v={invoice.client?.contactPerson} />
              <Row k="Email" v={invoice.client?.email} />
              <Row k="Phone" v={invoice.client?.phone} />
              <Row k="GSTIN" v={invoice.client?.gstin} />
              <Row k="PAN" v={invoice.client?.pan} />
              <Row
                k="Billing Address"
                v={addrLine({
                  line1: invoice.client?.addressLine1,
                  line2: invoice.client?.addressLine2,
                  city: invoice.client?.city,
                  state: invoice.client?.state,
                  pincode: invoice.client?.pincode,
                })}
              />
            </div>
          </Section>

          <Section icon="₹" title="Line Items" sub={`${(invoice.lineItems || []).length} item(s)`}>
            <table className={styles.miniLineTable}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>HSN/SAC</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.lineItems || []).map((it: any, i: number) => (
                  <tr key={i}>
                    <td>{it.description}</td>
                    <td>{it.hsnSac || "—"}</td>
                    <td>{it.qty}</td>
                    <td>{inr(it.rate)}</td>
                    <td>{inr(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section icon={<FiFileText />} title="Invoice Details" sub="Dates, place of supply and tax mode">
            <div className={styles.infoGrid}>
              <Row k="Invoice Date" v={fmtDate(invoice.invoiceDate)} />
              <Row k="Due Date" v={invoice.dueDate ? fmtDate(invoice.dueDate) : "—"} />
              <Row k="Place of Supply" v={invoice.placeOfSupply} />
              <Row k="Tax Mode" v={invoice.taxMode === "INTRA" ? "Intra State" : "Inter State"} />
              <Row k="Reverse Charge" v={invoice.reverseCharge ? "Yes" : "No"} />
              <Row k="Created By" v={invoice.createdBy} />
            </div>
          </Section>
        </div>

        <div className={styles.detailSide}>
          <Section icon={<FiFileText />} title="Account Summary" sub="Totals for this invoice" defaultOpen>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <b>{inr(invoice.subtotal)}</b>
            </div>
            {(invoice.taxBreakup || []).map((t: any) => (
              <div className={styles.summaryRow} key={t.type}>
                <span>{t.type}</span>
                <b>{inr(t.amount)}</b>
              </div>
            ))}
            <div className={styles.summaryRow}>
              <span>Total Tax</span>
              <b>{inr(invoice.totalTax)}</b>
            </div>
            <div className={`${styles.summaryRow} ${styles.summaryGrand}`}>
              <span>Grand Total</span>
              <b>{inr(invoice.grandTotal)}</b>
            </div>
            <div className={styles.summaryRow}>
              <span>Received</span>
              <b>{inr(invoice.amountReceived)}</b>
            </div>
            <div className={styles.summaryRow}>
              <span>Balance Due</span>
              <b style={{ color: (invoice.balanceDue || 0) > 0 ? "#b91c1c" : "#15803d" }}>
                {inr(invoice.balanceDue ?? invoice.grandTotal)}
              </b>
            </div>
          </Section>

          <Section
            icon={<FiCreditCard />}
            title="Payments"
            sub={`${(invoice.payments || []).length} recorded · Balance ${inr(invoice.balanceDue ?? invoice.grandTotal)}`}
            defaultOpen
          >
            {(invoice.payments || []).length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: 13 }}>No payments recorded yet.</p>
            ) : (
              <div style={{ marginBottom: 12 }}>
                {(invoice.payments || []).map((p: any) => (
                  <div
                    key={p._id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid #f1f5f9",
                      fontSize: 12.5,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: "#111827" }}>{inr(p.amount)}</div>
                      <div style={{ color: "#6b7280" }}>
                        {fmtDate(p.date)} · {p.mode}
                        {p.note ? ` · ${p.note}` : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePayment(p._id)}
                      style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", padding: 4 }}
                      title="Remove payment"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showPaymentForm ? (
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 8px", fontSize: 12.5 }}
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 8px", fontSize: 12.5 }}
                  />
                </div>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 8px", fontSize: 12.5, marginBottom: 8 }}
                >
                  {["Cash", "Bank Transfer", "UPI", "Cheque", "Card", "Other"].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Note (optional)"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 8px", fontSize: 12.5, marginBottom: 10, boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={recordPayment}
                    disabled={recordingPayment}
                    className={styles.editBtn}
                  >
                    {recordingPayment ? "Saving..." : "Save Payment"}
                  </button>
                  <button type="button" onClick={() => setShowPaymentForm(false)} className={styles.deleteBtn}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className={styles.editBtn} onClick={() => setShowPaymentForm(true)}>
                <FiPlus /> Record Payment
              </button>
            )}
          </Section>

          {invoice.seller?.showBankDetailsOnInvoice && (
            <Section icon={<FiCreditCard />} title="Bank Details" sub="Shown on this invoice">
              <Row k="Account Name" v={invoice.seller?.bank?.accountName} />
              <Row k="Account Number" v={invoice.seller?.bank?.accountNumber} />
              <Row k="IFSC Code" v={invoice.seller?.bank?.ifscCode} />
              <Row k="Bank Name" v={invoice.seller?.bank?.bankName} />
              <Row k="Branch" v={invoice.seller?.bank?.branch} />
            </Section>
          )}

          {invoice.signedPdf?.fileName && (
            <Section icon={<FiUpload />} title="Signed Copy" sub={invoice.signedPdf.fileName}>
              <a href={invoice.signedPdf.data} download={invoice.signedPdf.fileName} className={styles.changeBtn}>
                Download signed copy
              </a>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
