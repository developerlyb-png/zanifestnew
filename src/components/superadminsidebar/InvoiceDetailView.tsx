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
    const rows = (invoice.lineItems || [])
      .map(
        (it: any, i: number) =>
          `<tr><td>${i + 1}</td><td>${esc(it.description)}</td><td>${esc(it.hsnSac)}</td><td>${it.qty}</td><td>${inr(it.rate)}</td><td>${inr(it.amount)}</td></tr>`
      )
      .join("");
    const taxRows = (invoice.taxBreakup || [])
      .map((t: any) => `<tr><td>${t.type} (${t.ratePercent}%)</td><td>${inr(t.amount)}</td></tr>`)
      .join("");
    w.document.write(`<!doctype html><html><head><title>Invoice ${esc(invoice.invoiceNo)}</title>
<style>body{font-family:Arial,sans-serif;padding:28px;color:#111}h1{font-size:20px}h2{font-size:14px;margin-top:22px;color:#444}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:7px 10px;font-size:12.5px;text-align:left}
th{background:#f3f4f6}.tot{font-weight:700}</style></head><body>
<h1>${esc(invoice.seller?.companyName)}</h1>
<p>${esc(addrLine(invoice.seller?.registeredAddress))}<br/>GSTIN: ${esc(invoice.seller?.gstin)} · PAN: ${esc(invoice.seller?.pan)}</p>
<h2>Invoice ${esc(invoice.invoiceNo)} — ${esc(fmtDate(invoice.invoiceDate))}</h2>
<p><b>Bill To:</b> ${esc(invoice.client?.name)}<br/>${esc(addrLine({ line1: invoice.client?.addressLine1, line2: invoice.client?.addressLine2, city: invoice.client?.city, state: invoice.client?.state, pincode: invoice.client?.pincode }))}<br/>GSTIN: ${esc(invoice.client?.gstin)}</p>
<table><tr><th>#</th><th>Description</th><th>HSN/SAC</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>${rows}</table>
<h2>Tax</h2>
<table><tr><th>Type</th><th>Amount</th></tr>${taxRows}<tr class="tot"><td>Grand Total</td><td>${inr(invoice.grandTotal)}</td></tr></table>
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
