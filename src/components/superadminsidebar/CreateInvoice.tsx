"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/components/superadminsidebar/Invoice.module.css";
import { toast } from "react-hot-toast";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiPlus,
  FiSave,
  FiSearch,
  FiTrash2,
  FiTruck,
  FiUsers,
  FiFileText,
} from "react-icons/fi";
import { INDIAN_STATES, TAX_MODE_LABELS, INVOICE_STATUSES } from "@/constants/invoice";

interface SellerProfileRow {
  _id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstin: string;
  pan: string;
  registeredAddress: { line1: string; line2?: string; pincode: string; city: string; state: string };
  corporateAddress?: { line1: string; line2?: string; pincode: string; city: string; state: string };
  useRegisteredAsCorporate: boolean;
  invoiceSeries: string;
  lastSequenceUsed: number;
  isDefault: boolean;
}

interface InvoiceClientRow {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstin: string;
  pan: string;
  addressLine1: string;
  addressLine2?: string;
  pincode: string;
  city: string;
  state: string;
}

interface LineItem {
  description: string;
  hsnSac: string;
  qty: string;
  rate: string;
  discountType: "₹" | "%";
  discountValue: string;
}

const EMPTY_ITEM: LineItem = { description: "", hsnSac: "", qty: "1", rate: "", discountType: "₹", discountValue: "0" };

const STEP_LABELS = [
  { label: "Seller Info", sub: "Who is issuing this invoice" },
  { label: "Bill To", sub: "Who the invoice is for" },
  { label: "Invoice Details", sub: "Items, tax and totals" },
];

const addrLine = (a?: { line1: string; line2?: string; city: string; state: string; pincode: string }) =>
  a ? [a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(", ") : "—";

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CreateInvoice({
  onCancel,
  onCreated,
  editInvoiceId,
}: {
  onCancel: () => void;
  onCreated: (id: string) => void;
  editInvoiceId?: string;
}) {
  const isEdit = !!editInvoiceId;
  const [step, setStep] = useState(isEdit ? 3 : 1);
  const [loadingInvoice, setLoadingInvoice] = useState(isEdit);
  const [invoiceNo, setInvoiceNo] = useState("");

  const [sellers, setSellers] = useState<SellerProfileRow[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [sellerId, setSellerId] = useState("");

  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState<InvoiceClientRow[]>([]);
  const [searchingClients, setSearchingClients] = useState(false);
  const [client, setClient] = useState<InvoiceClientRow | null>(null);

  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [taxMode, setTaxMode] = useState<"INTRA" | "INTER">("INTER");
  const [taxModeTouched, setTaxModeTouched] = useState(false);
  const [reverseCharge, setReverseCharge] = useState(false);
  const [status, setStatus] = useState<string>("Draft");
  const [taxRatePercent, setTaxRatePercent] = useState("18");
  const [items, setItems] = useState<LineItem[]>([{ ...EMPTY_ITEM }]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const seller = sellers.find((s) => s._id === sellerId) || null;

  useEffect(() => {
    fetch("/api/admin/seller-profiles", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const list: SellerProfileRow[] = d.profiles || [];
        setSellers(list);
        if (!editInvoiceId) {
          const def = list.find((s) => s.isDefault) || list[0];
          if (def) setSellerId(def._id);
        }
      })
      .catch(() => setSellers([]))
      .finally(() => setLoadingSellers(false));
  }, [editInvoiceId]);

  // Load the existing invoice when editing, and prefill every field.
  useEffect(() => {
    if (!editInvoiceId) return;
    setLoadingInvoice(true);
    fetch(`/api/admin/invoices?id=${editInvoiceId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) throw new Error(d.message);
        const inv = d.invoice;
        setInvoiceNo(inv.invoiceNo);
        setSellerId(inv.seller?.profileId || "");
        setClient({
          _id: inv.client?.clientId,
          name: inv.client?.name,
          contactPerson: inv.client?.contactPerson,
          email: inv.client?.email,
          phone: inv.client?.phone,
          gstin: inv.client?.gstin,
          pan: inv.client?.pan,
          addressLine1: inv.client?.addressLine1,
          addressLine2: inv.client?.addressLine2,
          pincode: inv.client?.pincode,
          city: inv.client?.city,
          state: inv.client?.state,
        });
        setInvoiceDate(inv.invoiceDate ? String(inv.invoiceDate).slice(0, 10) : "");
        setDueDate(inv.dueDate ? String(inv.dueDate).slice(0, 10) : "");
        setPlaceOfSupply(inv.placeOfSupply || "");
        setTaxMode(inv.taxMode === "INTRA" ? "INTRA" : "INTER");
        setTaxModeTouched(true);
        setReverseCharge(!!inv.reverseCharge);
        setStatus(inv.status || "Draft");
        setTaxRatePercent(String(inv.taxRatePercent ?? 18));
        setItems(
          (inv.lineItems || []).map((it: any) => ({
            description: it.description || "",
            hsnSac: it.hsnSac || "",
            qty: String(it.qty ?? 1),
            rate: String(it.rate ?? ""),
            discountType: it.discountType === "%" ? "%" : "₹",
            discountValue: String(it.discountValue ?? 0),
          }))
        );
      })
      .catch((e: any) => toast.error(e.message || "Failed to load invoice"))
      .finally(() => setLoadingInvoice(false));
  }, [editInvoiceId]);

  // Debounced client search.
  useEffect(() => {
    if (!clientQuery.trim()) {
      setClientResults([]);
      return;
    }
    setSearchingClients(true);
    const t = setTimeout(() => {
      fetch(`/api/admin/invoice-clients?q=${encodeURIComponent(clientQuery.trim())}`, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => setClientResults(d.clients || []))
        .catch(() => setClientResults([]))
        .finally(() => setSearchingClients(false));
    }, 300);
    return () => clearTimeout(t);
  }, [clientQuery]);

  const selectClient = (c: InvoiceClientRow) => {
    setClient(c);
    setClientQuery("");
    setClientResults([]);
    if (!placeOfSupply) setPlaceOfSupply(c.state);
    if (!taxModeTouched && seller) {
      setTaxMode(seller.registeredAddress.state.toLowerCase() === c.state.toLowerCase() ? "INTRA" : "INTER");
    }
  };

  const nextInvoiceNoPreview = seller
    ? `${seller.invoiceSeries}${String((seller.lastSequenceUsed || 0) + 1).padStart(3, "0")}`
    : "";

  const setItem = (i: number, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (i: number) => setItems((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  const lineAmount = (it: LineItem) => {
    const qty = Number(it.qty) || 0;
    const rate = Number(it.rate) || 0;
    const gross = qty * rate;
    const discount = it.discountType === "%" ? (gross * (Number(it.discountValue) || 0)) / 100 : Number(it.discountValue) || 0;
    return Math.max(0, gross - discount);
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + lineAmount(it), 0);
    const rate = Number(taxRatePercent) || 0;
    const breakup =
      taxMode === "INTRA"
        ? [
            { type: "CGST", ratePercent: rate / 2, amount: (subtotal * rate) / 2 / 100 },
            { type: "SGST", ratePercent: rate / 2, amount: (subtotal * rate) / 2 / 100 },
          ]
        : [{ type: "IGST", ratePercent: rate, amount: (subtotal * rate) / 100 }];
    const totalTax = breakup.reduce((s, t) => s + t.amount, 0);
    return { subtotal, breakup, totalTax, grandTotal: subtotal + totalTax };
  }, [items, taxMode, taxRatePercent]);

  const stepError = (): string | null => {
    if (step === 1) {
      if (!sellerId) return "Select a seller profile";
    }
    if (step === 2) {
      if (!client) return "Search and select a client to bill";
    }
    if (step === 3) {
      if (!invoiceDate) return "Invoice date is required";
      if (!placeOfSupply) return "Place of supply is required";
      const bad = items.find((it) => !it.description.trim() || Number(it.qty) <= 0);
      if (bad) return "Every line item needs a description and a quantity greater than 0";
    }
    return null;
  };

  const next = () => {
    const err = stepError();
    if (err) return toast.error(err);
    setStep((s) => Math.min(3, s + 1));
  };

  const submit = async () => {
    const err = stepError();
    if (err) return toast.error(err);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...(isEdit ? { id: editInvoiceId } : {}),
          sellerProfileId: sellerId,
          clientId: client?._id,
          invoiceDate,
          dueDate: dueDate || undefined,
          placeOfSupply,
          taxMode,
          reverseCharge,
          status,
          taxRatePercent: Number(taxRatePercent) || 0,
          lineItems: items.map((it) => ({
            description: it.description,
            hsnSac: it.hsnSac,
            qty: Number(it.qty) || 0,
            rate: Number(it.rate) || 0,
            discountType: it.discountType,
            discountValue: Number(it.discountValue) || 0,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || `Failed to ${isEdit ? "update" : "create"} invoice`);
        return;
      }
      toast.success(`Invoice ${data.invoice.invoiceNo} ${isEdit ? "updated" : "created"}`);
      onCreated(data.invoice._id);
    } catch (err) {
      console.log(isEdit ? "UPDATE INVOICE ERROR" : "CREATE INVOICE ERROR", err);
      toast.error(`Failed to ${isEdit ? "update" : "create"} invoice`);
    } finally {
      setSubmitting(false);
    }
  };

  const pct = step === 1 ? 0 : step === 2 ? 50 : 100;

  if (loadingInvoice) {
    return (
      <div className={styles.wizard}>
        <button type="button" className={styles.backLink} onClick={onCancel}>
          <FiArrowLeft /> Back to invoice
        </button>
        <div className={styles.card}>
          <p className={styles.cardHint}>Loading invoice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wizard}>
      <button type="button" className={styles.backLink} onClick={onCancel}>
        <FiArrowLeft /> {isEdit ? "Back to invoice" : "Back to invoices"}
      </button>
      <div className={styles.wizTop}>
        <div>
          <h1 className={styles.wizTitle}>{isEdit ? `Edit Invoice ${invoiceNo}` : "Create Invoice"}</h1>
          <p className={styles.wizSub}>
            {isEdit
              ? "Update the seller, client, items or totals for this invoice."
              : "Three quick steps — pick the seller, the client, then the line items."}
          </p>
        </div>
      </div>

      <div className={styles.stepper}>
        {STEP_LABELS.map((s, i) => {
          const n = i + 1;
          const state = n < step ? "done" : n === step ? "active" : "";
          return (
            <button
              key={s.label}
              type="button"
              className={`${styles.stepBtn} ${state === "active" ? styles.stepActive : ""} ${state === "done" ? styles.stepDone : ""}`}
              onClick={() => n < step && setStep(n)}
              disabled={n > step}
            >
              <span className={styles.stepDot}>{state === "done" ? <FiCheck size={14} /> : n}</span>
              <span>
                <div className={styles.stepLabel}>{s.label}</div>
                <div className={styles.stepSub}>{s.sub}</div>
              </span>
            </button>
          );
        })}
      </div>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>

      {step === 1 && (
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>
              <FiTruck style={{ verticalAlign: -2, marginRight: 8 }} />
              Seller Profile
            </h3>
          </div>

          {loadingSellers ? (
            <p className={styles.cardHint}>Loading seller profiles...</p>
          ) : sellers.length === 0 ? (
            <p className={styles.cardHint}>
              No seller profiles found. Create one under Config Seller before issuing an invoice.
            </p>
          ) : (
            <>
              {sellers.length > 1 && (
                <select className={styles.select} value={sellerId} onChange={(e) => setSellerId(e.target.value)} style={{ marginBottom: 16 }}>
                  {sellers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.companyName} {s.isDefault ? "(Default)" : ""}
                    </option>
                  ))}
                </select>
              )}

              {seller && (
                <div className={styles.infoGrid}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoKey}>Company Name</span>
                    <span className={styles.infoVal}>{seller.companyName}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoKey}>Contact Person</span>
                    <span className={styles.infoVal}>{seller.contactPerson}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoKey}>Email</span>
                    <span className={styles.infoVal}>{seller.email}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoKey}>Phone</span>
                    <span className={styles.infoVal}>{seller.phone}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoKey}>GSTIN</span>
                    <span className={styles.infoVal}>{seller.gstin}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoKey}>PAN</span>
                    <span className={styles.infoVal}>{seller.pan}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoKey}>Registered Address</span>
                    <span className={styles.infoVal}>{addrLine(seller.registeredAddress)}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoKey}>Corporate Address</span>
                    <span className={styles.infoVal}>
                      {seller.useRegisteredAsCorporate ? "Same as Registered Address" : addrLine(seller.corporateAddress)}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoKey}>{isEdit ? "Invoice No." : "Next Invoice No."}</span>
                    <span className={styles.infoVal}>{isEdit ? invoiceNo : nextInvoiceNoPreview}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3 className={styles.cardTitle}>
              <FiUsers style={{ verticalAlign: -2, marginRight: 8 }} />
              Bill To
            </h3>
          </div>

          {client ? (
            <div className={styles.selectedPanel}>
              <div>
                <div className={styles.selectedMain}>{client.name}</div>
                <div className={styles.selectedSub}>
                  {client.contactPerson} · {client.email} · {client.phone}
                </div>
              </div>
              <button type="button" className={styles.changeBtn} onClick={() => setClient(null)}>
                Change client
              </button>
            </div>
          ) : (
            <div className={styles.searchBox}>
              <FiSearch size={14} color="#94a3b8" />
              <input
                placeholder="Search clients by name, email, or GST number..."
                value={clientQuery}
                onChange={(e) => setClientQuery(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {!client && clientQuery.trim() && (
            <div className={styles.searchResults}>
              {searchingClients ? (
                <div className={styles.searchEmpty}>Searching...</div>
              ) : clientResults.length === 0 ? (
                <div className={styles.searchEmpty}>No clients found. Add them under Invoice Clients first.</div>
              ) : (
                clientResults.map((c) => (
                  <button key={c._id} type="button" className={styles.searchResultRow} onClick={() => selectClient(c)}>
                    <span>
                      <div className={styles.searchResultMain}>{c.name}</div>
                      <div className={styles.searchResultSub}>
                        {c.contactPerson} · {c.email}
                      </div>
                    </span>
                    <span className={styles.searchResultSub}>{c.gstin}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {client && (
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>Contact Person</span>
                <span className={styles.infoVal}>{client.contactPerson}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>Email</span>
                <span className={styles.infoVal}>{client.email}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>Phone</span>
                <span className={styles.infoVal}>{client.phone}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>GSTIN</span>
                <span className={styles.infoVal}>{client.gstin}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>PAN</span>
                <span className={styles.infoVal}>{client.pan}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>Billing Address</span>
                <span className={styles.infoVal}>
                  {addrLine({ line1: client.addressLine1, line2: client.addressLine2, city: client.city, state: client.state, pincode: client.pincode })}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <>
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}>
                <FiFileText style={{ verticalAlign: -2, marginRight: 8 }} />
                Invoice Details
              </h3>
            </div>
            <div className={styles.grid4}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Invoice Date<span className={styles.req}>*</span>
                </label>
                <input type="date" className={styles.input} value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Due Date</label>
                <input type="date" className={styles.input} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Place of Supply<span className={styles.req}>*</span>
                </label>
                <select className={styles.select} value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)}>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Tax Mode<span className={styles.req}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={taxMode}
                  onChange={(e) => {
                    setTaxMode(e.target.value as "INTRA" | "INTER");
                    setTaxModeTouched(true);
                  }}
                >
                  {Object.entries(TAX_MODE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Reverse Charge Applicable?</label>
                <select className={styles.select} value={reverseCharge ? "yes" : "no"} onChange={(e) => setReverseCharge(e.target.value === "yes")}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Status</label>
                <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
                  {INVOICE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}>₹ Line Items</h3>
            </div>
            <div className={styles.lineTableWrap}>
              <table className={styles.lineTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th style={{ minWidth: 180 }}>Description</th>
                    <th>HSN/SAC</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Discount</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>
                        <input className={styles.lineInput} value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} />
                      </td>
                      <td>
                        <input className={styles.lineInput} style={{ width: 90 }} value={it.hsnSac} onChange={(e) => setItem(i, { hsnSac: e.target.value })} />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          className={styles.lineInput}
                          style={{ width: 64 }}
                          value={it.qty}
                          onChange={(e) => setItem(i, { qty: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          className={styles.lineInput}
                          style={{ width: 90 }}
                          value={it.rate}
                          onChange={(e) => setItem(i, { rate: e.target.value })}
                        />
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <select
                            className={styles.lineInput}
                            style={{ width: 56 }}
                            value={it.discountType}
                            onChange={(e) => setItem(i, { discountType: e.target.value as "₹" | "%" })}
                          >
                            <option value="₹">₹</option>
                            <option value="%">%</option>
                          </select>
                          <input
                            type="number"
                            min={0}
                            className={styles.lineInput}
                            style={{ width: 64 }}
                            value={it.discountValue}
                            onChange={(e) => setItem(i, { discountValue: e.target.value })}
                          />
                        </div>
                      </td>
                      <td className={styles.lineAmount}>{inr(lineAmount(it))}</td>
                      <td>
                        <button type="button" className={styles.lineRemove} onClick={() => removeItem(i)} title="Remove">
                          <FiTrash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className={styles.addLineBtn} onClick={addItem}>
              <FiPlus size={14} /> Add Item
            </button>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}>% Tax Calculation</h3>
              <div className={styles.field} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <label className={styles.label} style={{ marginBottom: 0 }}>
                  Rate (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={`${styles.input} ${styles.taxRateInput}`}
                  value={taxRatePercent}
                  onChange={(e) => setTaxRatePercent(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.taxBox}>
              <div className={styles.taxRow}>
                <span className={styles.taxRowLabel}>Taxable Amount</span>
                <span className={styles.taxRowValue}>{inr(totals.subtotal)}</span>
              </div>
              {totals.breakup.map((t) => (
                <div className={styles.taxRow} key={t.type}>
                  <span className={styles.taxRowLabel}>
                    {t.type} ({t.ratePercent.toFixed(1)}%)
                  </span>
                  <span className={styles.taxRowValue}>{inr(t.amount)}</span>
                </div>
              ))}
              <div className={styles.taxRow}>
                <span className={styles.taxRowLabel}>Total Tax</span>
                <span className={styles.taxRowValue}>{inr(totals.totalTax)}</span>
              </div>
              <div className={`${styles.taxRow} ${styles.taxGrandRow}`}>
                <span className={styles.taxRowLabel}>Grand Total</span>
                <span className={styles.taxRowValue}>{inr(totals.grandTotal)}</span>
              </div>
            </div>
          </div>
        </>
      )}

      <div className={styles.navRow}>
        <button type="button" className={styles.btnGhost} onClick={step === 1 ? onCancel : () => setStep((s) => s - 1)}>
          <FiArrowLeft /> {step === 1 ? "Cancel" : "Previous"}
        </button>
        {step < 3 ? (
          <button type="button" className={styles.btnPrimary} onClick={next}>
            Next <FiArrowRight />
          </button>
        ) : (
          <button type="button" className={styles.btnPrimary} onClick={submit} disabled={submitting}>
            {isEdit ? <FiSave /> : <FiCheckCircle />}
            {isEdit ? (submitting ? "Saving..." : "Save Changes") : submitting ? "Generating..." : "Generate Invoice"}
          </button>
        )}
      </div>
    </div>
  );
}
