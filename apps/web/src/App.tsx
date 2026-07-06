import React, { useState, useRef, useEffect } from 'react';
import './index.css';
import {
  useGetQuotations,
  useGetProformaInvoices,
  useGetFinalInvoices,
  useCreateQuotation,
  useCreateProformaInvoice,
  useCreateFinalInvoice,
  useGetClients,
  useCreateClient,
  useConvertQuoteToProforma,
  useConvertQuoteToInvoice,
  useConvertProformaToInvoice,
  useUpdateQuotation,
  useUpdateProformaInvoice,
  useUpdateFinalInvoice,
  useDeleteQuotation,
  useDeleteProformaInvoice,
  useDeleteFinalInvoice,
  apiClient,
} from '@my-billing/api-client';
import { type Quotation, type ProformaInvoice, type FinalInvoice } from '@my-billing/database';
import { generateDocumentHtml } from '@my-billing/document-templates';

// Trigger Vercel deployment
export default function App() {
  // Querying using shared TanStack Query hooks from @my-billing/api-client
  const { data: quotations = [], isLoading: loadingQuotes, error: errorQuotes } = useGetQuotations();
  const { data: proformas = [], isLoading: loadingProformas, error: errorProformas } = useGetProformaInvoices();
  const { data: invoices = [], isLoading: loadingInvoices, error: errorInvoices } = useGetFinalInvoices();
  const { data: clients = [], isLoading: loadingClients } = useGetClients();

  const createClientMutation = useCreateClient();
  const createQuotation = useCreateQuotation();
  const createProforma = useCreateProformaInvoice();
  const createInvoice = useCreateFinalInvoice();
  const convertQuote = useConvertQuoteToProforma();
  const convertQuoteToInvoice = useConvertQuoteToInvoice();
  const convertProforma = useConvertProformaToInvoice();
  const updateQuotation = useUpdateQuotation();
  const updateProforma = useUpdateProformaInvoice();
  const updateInvoice = useUpdateFinalInvoice();
  const deleteQuotation = useDeleteQuotation();
  const deleteProforma = useDeleteProformaInvoice();
  const deleteInvoice = useDeleteFinalInvoice();

  const isApiError = errorQuotes || errorProformas || errorInvoices;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docType, setDocType] = useState<'QUOTATION' | 'PROFORMA' | 'FINAL_INVOICE'>('QUOTATION');
  const [printDoc, setPrintDoc] = useState<Quotation | ProformaInvoice | FinalInvoice | null>(null);
  const [editingDoc, setEditingDoc] = useState<Quotation | ProformaInvoice | FinalInvoice | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  
  const [isApiLoading, setIsApiLoading] = useState(false);

  useEffect(() => {
    const handleLoading = (e: Event) => {
      setIsApiLoading((e as CustomEvent<boolean>).detail);
    };
    window.addEventListener('apiClient:loading', handleLoading);
    return () => {
      window.removeEventListener('apiClient:loading', handleLoading);
    };
  }, []);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getFinancialYear = (date: Date = new Date()) => {
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth(); // 0-indexed, April is 3
    const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    const endYear = (startYear + 1) % 100;
    return `${startYear}-${String(endYear).padStart(2, '0')}`;
  };

  const getDocumentData = (doc: Quotation | ProformaInvoice | FinalInvoice) => {
    return {
      documentType: doc.documentType,
      documentNumber: doc.documentNumber || (doc as any).quoteNumber || (doc as any).proformaNumber || (doc as any).invoiceNumber || '',
      issueDate: doc.issueDate,
      dueDate: (doc as any).dueDate,
      validUntil: (doc as any).validUntil,
      clientInfo: {
        name: doc.clientInfo?.name || '',
        email: doc.clientInfo?.email,
        billingAddress: doc.clientInfo?.billingAddress,
        billingAndShippingAddress: doc.clientInfo?.billingAddress,
        gstin: doc.clientInfo?.gstin,
        stateName: (doc.clientInfo as any)?.stateName || 'Maharashtra',
        stateCode: (doc.clientInfo as any)?.stateCode || '27',
      },
      items: (doc.items || []).map(item => ({
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        taxRate: item.taxRate,
        hsnSac: (item as any).hsnSac || '998311',
        per: (item as any).per || 'nos',
        discountPercent: (item as any).discountPercent || 0,
      })),
      notes: doc.notes,
      currency: doc.currency,
      applyGst: (doc as any).applyGst !== false,
      logoUrl: (doc as any).logoUrl || `${window.location.origin}/website_icon.png`,
    };
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    if (printDoc) {
      const docNum = printDoc.documentNumber || (printDoc as any).quoteNumber || (printDoc as any).proformaNumber || (printDoc as any).invoiceNumber || '';
      // Replace '/' with '-' to avoid path issues on macOS/Linux
      const safeNum = docNum.replace(/\//g, '-');
      if (safeNum) {
        document.title = safeNum;
      }
    }

    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
        if (iframeDoc) {
          iframeDoc.title = document.title;
        }
      } catch (e) {
        console.error(e);
      }
      iframeRef.current.contentWindow.print();
    } else {
      window.print();
    }

    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Daily Mode & History States
  const [viewMode, setViewMode] = useState<'daily' | 'history'>('daily');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    billingAddress: '',
    taxId: '',
    gstin: '',
    pan: '',
  });

  const [docNumber, setDocNumber] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [notes, setNotes] = useState('');
  const [dateVal, setDateVal] = useState('');
  const [items, setItems] = useState<Array<{ description: string; quantity: number | undefined; price: number; taxRate: number; hsnSac: string; discountPercent?: number }>>([
    { description: '', quantity: 1, price: 0, taxRate: 18, hsnSac: '998311', discountPercent: 0 }
  ]);
  const [quotationRef, setQuotationRef] = useState('');
  const [proformaRef, setProformaRef] = useState('');

  // Date and Search Helpers
  const isToday = (dateStr?: Date | string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const filterBySearch = (list: any[]) => {
    if (!searchQuery) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(item => {
      const docNum = (item.documentNumber || item.quoteNumber || item.proformaNumber || item.invoiceNumber || '').toLowerCase();
      const clientName = (item.clientInfo?.name || '').toLowerCase();
      const clientEmail = (item.clientInfo?.email || '').toLowerCase();
      return docNum.includes(query) || clientName.includes(query) || clientEmail.includes(query);
    });
  };

  const filteredQuotes = viewMode === 'daily'
    ? quotations.filter((q: any) => isToday(q.createdAt || q.issueDate))
    : filterBySearch(quotations);

  const filteredProformas = viewMode === 'daily'
    ? proformas.filter((p: any) => isToday(p.createdAt || p.issueDate))
    : filterBySearch(proformas);

  const filteredInvoices = viewMode === 'daily'
    ? invoices.filter((i: any) => isToday(i.createdAt || i.issueDate))
    : filterBySearch(invoices);

  // Aggregate values for display
  const totalQuoteVolume = (quotations as Quotation[]).reduce((sum: number, q: Quotation) => sum + (q.totalAmount || 0), 0);
  const totalProformaVolume = (proformas as ProformaInvoice[]).reduce((sum: number, p: ProformaInvoice) => sum + (p.totalAmount || 0), 0);
  const totalInvoiceVolume = (invoices as FinalInvoice[]).reduce((sum: number, i: FinalInvoice) => sum + (i.totalAmount || 0), 0);

  const todayQuoteVolume = (quotations as Quotation[]).filter((q: any) => isToday(q.createdAt || q.issueDate)).reduce((sum, q) => sum + (q.totalAmount || 0), 0);
  const todayProformaVolume = (proformas as ProformaInvoice[]).filter((p: any) => isToday(p.createdAt || p.issueDate)).reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const todayInvoiceVolume = (invoices as FinalInvoice[]).filter((i: any) => isToday(i.createdAt || i.issueDate)).reduce((sum, i) => sum + (i.totalAmount || 0), 0);

  const activeQuoteVolume = viewMode === 'daily' ? todayQuoteVolume : totalQuoteVolume;
  const activeProformaVolume = viewMode === 'daily' ? todayProformaVolume : totalProformaVolume;
  const activeInvoiceVolume = viewMode === 'daily' ? todayInvoiceVolume : totalInvoiceVolume;

  const activeQuoteCount = viewMode === 'daily' ? filteredQuotes.length : quotations.length;
  const activeProformaCount = viewMode === 'daily' ? filteredProformas.length : proformas.length;
  const activeInvoiceCount = viewMode === 'daily' ? filteredInvoices.length : invoices.length;

  const formatCurrency = (val: number, curr = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr }).format(val);
  };

  const formatDate = (dateStr?: Date | string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderAuditTrail = (doc: any) => {
    const history: React.ReactNode[] = [];
    const docId = doc.id || doc._id;

    if (doc.documentType === 'QUOTATION') {
      const relatedProforma: any = proformas.find((p: any) => p.quotationRef === docId);
      if (relatedProforma) {
        history.push(
          <div key="to-proforma" className="audit-trail-item">
            <span>➔ Converted to Proforma Invoice:</span> <strong>{relatedProforma.documentNumber || relatedProforma.proformaNumber}</strong>
          </div>
        );
        const relatedInvoice: any = invoices.find((i: any) => i.proformaRef === relatedProforma.id || i.proformaRef === relatedProforma._id);
        if (relatedInvoice) {
          history.push(
            <div key="to-invoice" className="audit-trail-item">
              <span>➔ Converted to Final Invoice:</span> <strong>{relatedInvoice.documentNumber || relatedInvoice.invoiceNumber}</strong>
            </div>
          );
        }
      }
    } else if (doc.documentType === 'PROFORMA') {
      const relatedQuotation: any = quotations.find((q: any) => (q.id || q._id) === doc.quotationRef);
      if (relatedQuotation) {
        history.push(
          <div key="from-quote" className="audit-trail-item">
            <span>← Converted from Quotation:</span> <strong>{relatedQuotation.documentNumber || relatedQuotation.quoteNumber}</strong>
          </div>
        );
      }
      const relatedInvoice: any = invoices.find((i: any) => i.proformaRef === docId);
      if (relatedInvoice) {
        history.push(
          <div key="to-invoice" className="audit-trail-item">
            <span>➔ Converted to Final Invoice:</span> <strong>{relatedInvoice.documentNumber || relatedInvoice.invoiceNumber}</strong>
          </div>
        );
      }
    } else if (doc.documentType === 'FINAL_INVOICE') {
      const relatedProforma: any = proformas.find((p: any) => (p.id || p._id) === doc.proformaRef);
      if (relatedProforma) {
        history.push(
          <div key="from-proforma" className="audit-trail-item">
            <span>← Converted from Proforma Invoice:</span> <strong>{relatedProforma.documentNumber || relatedProforma.proformaNumber}</strong>
          </div>
        );
        const relatedQuotation: any = quotations.find((q: any) => (q.id || q._id) === relatedProforma.quotationRef);
        if (relatedQuotation) {
          history.push(
            <div key="from-quote" className="audit-trail-item">
              <span>← Source Quotation:</span> <strong>{relatedQuotation.documentNumber || relatedQuotation.quoteNumber}</strong>
            </div>
          );
        }
      }
    }

    if (history.length === 0) return null;

    return (
      <div className="audit-trail-container no-print" style={{ padding: '1rem', margin: '0 0 1rem 0' }}>
        <h4 className="audit-trail-title" style={{ color: '#eab308', margin: '0 0 0.5rem 0', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>⛓️ Document Reference History</h4>
        <div className="audit-trail-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {history}
        </div>
      </div>
    );
  };

  // Form Handlers
  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, price: 0, taxRate: 18, hsnSac: '998311', discountPercent: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setItems(updated);
  };

  const getItemQty = (qty: number | undefined) => {
    return qty !== undefined && qty !== null ? qty : 1;
  };

  const formSubTotal = items.reduce((sum, item) => {
    const base = getItemQty(item.quantity) * item.price;
    const disc = base * ((Number(item.discountPercent) || 0) / 100);
    return sum + (base - disc);
  }, 0);
  const formTaxAmount = items.reduce((sum, item) => {
    const base = getItemQty(item.quantity) * item.price;
    const disc = base * ((Number(item.discountPercent) || 0) / 100);
    const taxable = base - disc;
    return sum + (taxable * (item.taxRate / 100));
  }, 0);
  const formTotalAmount = formSubTotal + formTaxAmount;

  const resetForm = () => {
    setSelectedClientId('');
    setIsCreatingClient(false);
    setDocNumber('');
    setCurrency('INR');
    setNotes('');
    setDateVal('');
    setLogoUrl('');
    setEditingDoc(null);
    setQuotationRef('');
    setProformaRef('');
    setItems([{ description: '', quantity: 1, price: 0, taxRate: 18, hsnSac: '998311', discountPercent: 0 }]);
    setNewClientData({
      name: '',
      email: '',
      billingAddress: '',
      taxId: '',
      gstin: '',
      pan: '',
    });
  };

  const openModal = (type: 'QUOTATION' | 'PROFORMA' | 'FINAL_INVOICE') => {
    setDocType(type);
    resetForm();
    setEditingDoc(null);
    setLogoUrl('');
    
    // Auto-generate financial year format Document Number (e.g. 2026-27/CFS-QT-001)
    const listLen = type === 'QUOTATION' ? quotations.length : type === 'PROFORMA' ? proformas.length : invoices.length;
    const nextNum = String(listLen + 1).padStart(3, '0');
    const fy = getFinancialYear();
    const prefix = type === 'QUOTATION' ? 'CFS-QT' : type === 'PROFORMA' ? 'CFS-PRO' : 'CFS-INV';
    setDocNumber(`${fy}/${prefix}-${nextNum}`);
    setIsModalOpen(true);
  };

  const handleImportQuotation = (qId: string) => {
    setQuotationRef(qId);
    if (!qId) return;
    const q = quotations.find(item => (item.id || (item as any)._id) === qId);
    if (q) {
      setSelectedClientId(q.clientRef?.id || q.clientRef || '');
      setCurrency(q.currency);
      setNotes(q.notes || '');
      setLogoUrl((q as any).logoUrl || '');
      setProformaRef('');
      setItems((q.items || []).map(item => ({
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        taxRate: item.taxRate,
        hsnSac: (item as any).hsnSac || '998311',
        discountPercent: (item as any).discountPercent || 0
      })));
    }
  };

  const handleImportProforma = (pId: string) => {
    setProformaRef(pId);
    if (!pId) return;
    const p = proformas.find(item => (item.id || (item as any)._id) === pId);
    if (p) {
      setSelectedClientId(p.clientRef?.id || p.clientRef || '');
      setCurrency(p.currency);
      setNotes(p.notes || '');
      setLogoUrl((p as any).logoUrl || '');
      setQuotationRef(p.quotationRef || '');
      setItems((p.items || []).map(item => ({
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        taxRate: item.taxRate,
        hsnSac: (item as any).hsnSac || '998311',
        discountPercent: (item as any).discountPercent || 0
      })));
    }
  };

  const openEditModal = (doc: Quotation | ProformaInvoice | FinalInvoice) => {
    setEditingDoc(doc);
    setDocType(doc.documentType);
    setSelectedClientId(doc.clientRef?.id || doc.clientRef || '');
    setDocNumber(doc.documentNumber || (doc as any).quoteNumber || (doc as any).proformaNumber || (doc as any).invoiceNumber || '');
    setCurrency(doc.currency);
    setNotes(doc.notes || '');
    setLogoUrl((doc as any).logoUrl || '');
    setQuotationRef(doc.quotationRef || '');
    setProformaRef((doc as any).proformaRef || '');
    
    const dateLimit = doc.documentType === 'FINAL_INVOICE' ? (doc as any).dueDate : (doc as any).validUntil;
    if (dateLimit) {
      const d = new Date(dateLimit);
      const formattedDate = d.toISOString().split('T')[0];
      setDateVal(formattedDate);
    } else {
      setDateVal('');
    }
    
    setItems((doc.items || []).map(item => ({
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      taxRate: item.taxRate,
      hsnSac: (item as any).hsnSac || '998311',
      discountPercent: (item as any).discountPercent || 0
    })));
    
    setIsModalOpen(true);
  };

  const handleDeleteDoc = async (id: string, type: 'QUOTATION' | 'PROFORMA' | 'FINAL_INVOICE') => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) return;
    try {
      if (type === 'QUOTATION') {
        await deleteQuotation.mutateAsync(id);
      } else if (type === 'PROFORMA') {
        await deleteProforma.mutateAsync(id);
      } else {
        await deleteInvoice.mutateAsync(id);
      }
      alert('Document deleted successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete document.');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      try {
        const response = await apiClient.post('/upload', { name: file.name, data: base64Data });
        setLogoUrl(response.data.url);
        alert('Logo uploaded successfully!');
      } catch (err) {
        console.error(err);
        alert('Failed to upload logo.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateClient = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newClientData.name || !newClientData.email) {
      alert('Name and Email are required.');
      return;
    }
    try {
      const created = await createClientMutation.mutateAsync(newClientData);
      const createdId = created.id || created._id;
      setSelectedClientId(createdId);
      setIsCreatingClient(false);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to register client.');
    }
  };

  const handleConvertQuote = async (id: string) => {
    if (!confirm('Are you sure you want to convert this quotation to a Proforma Invoice?')) return;
    try {
      await convertQuote.mutateAsync(id);
      alert('Quotation successfully converted to Proforma Invoice!');
      setPrintDoc(null);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to convert Quotation.');
    }
  };

  const handleConvertQuoteToInvoiceDirect = async (id: string) => {
    if (!confirm('Are you sure you want to convert this quotation directly to a Final Invoice (bypassing Proforma)?')) return;
    try {
      await convertQuoteToInvoice.mutateAsync(id);
      alert('Quotation successfully converted directly to Final Invoice!');
      setPrintDoc(null);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to convert Quotation.');
    }
  };

  const handleConvertProforma = async (id: string) => {
    if (!confirm('Are you sure you want to convert this Proforma Invoice to a Final Invoice?')) return;
    try {
      await convertProforma.mutateAsync(id);
      alert('Proforma Invoice successfully converted to Final Invoice!');
      setPrintDoc(null);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to convert Proforma Invoice.');
    }
  };

  const handleUpdateQuoteStatus = async (id: string, status: string) => {
    try {
      await updateQuotation.mutateAsync({ id, data: { status: status as any } });
      alert(`Quotation status updated to ${status}!`);
    } catch (err) {
      console.error(err);
      alert('Failed to update Quotation status.');
    }
  };

  const handleUpdateProformaStatus = async (id: string, status: string) => {
    try {
      await updateProforma.mutateAsync({ id, data: { status: status as any } });
      alert(`Proforma status updated to ${status}!`);
    } catch (err) {
      console.error(err);
      alert('Failed to update Proforma status.');
    }
  };

  const handleMarkInvoicePaid = async (id: string) => {
    try {
      await updateInvoice.mutateAsync({ id, data: { status: 'PAID' as any, paymentStatus: 'PAID' as any } });
      alert('Invoice successfully marked as PAID!');
    } catch (err) {
      console.error(err);
      alert('Failed to mark Invoice as paid.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert('Please select or register a client.');
      return;
    }
    if (!docNumber) {
      alert('Please specify a document number.');
      return;
    }
    if (!dateVal) {
      alert('Please select a validity or due date.');
      return;
    }

    const selectedClient = clients.find(c => c.id === selectedClientId || (c as any)._id === selectedClientId);
    if (!selectedClient) return;

    const mappedItems = items.map(item => ({
      description: item.description,
      quantity: item.quantity !== undefined && item.quantity !== null && String(item.quantity) !== '' ? Number(item.quantity) : undefined,
      price: Number(item.price) || 0,
      taxRate: Number(item.taxRate) || 0,
      hsnSac: item.hsnSac || '998311',
      discountPercent: Number(item.discountPercent) || 0,
    }));

    try {
      if (editingDoc) {
        const docId = editingDoc.id || (editingDoc as any)._id;
        if (docType === 'QUOTATION') {
          const payload = {
            documentType: 'QUOTATION' as const,
            documentNumber: docNumber,
            quoteNumber: docNumber,
            clientRef: selectedClientId,
            clientInfo: {
              name: selectedClient.name,
              email: selectedClient.email,
              billingAddress: selectedClient.billingAddress || '',
              taxId: selectedClient.taxId || '',
              gstin: selectedClient.gstin || '',
              pan: selectedClient.pan || '',
            },
            items: mappedItems,
            currency: currency,
            notes: notes,
            validUntil: new Date(dateVal),
            logoUrl: logoUrl || undefined,
          };
          await updateQuotation.mutateAsync({ id: docId, data: payload as any });
        } else if (docType === 'PROFORMA') {
          const payload = {
            documentType: 'PROFORMA' as const,
            documentNumber: docNumber,
            proformaNumber: docNumber,
            clientRef: selectedClientId,
            clientInfo: {
              name: selectedClient.name,
              email: selectedClient.email,
              billingAddress: selectedClient.billingAddress || '',
              taxId: selectedClient.taxId || '',
              gstin: selectedClient.gstin || '',
              pan: selectedClient.pan || '',
            },
            items: mappedItems,
            currency: currency,
            notes: notes,
            validUntil: new Date(dateVal),
            logoUrl: logoUrl || undefined,
            quotationRef: quotationRef || undefined,
          };
          await updateProforma.mutateAsync({ id: docId, data: payload as any });
        } else {
          const payload = {
            documentType: 'FINAL_INVOICE' as const,
            documentNumber: docNumber,
            invoiceNumber: docNumber,
            clientRef: selectedClientId,
            clientInfo: {
              name: selectedClient.name,
              email: selectedClient.email,
              billingAddress: selectedClient.billingAddress || '',
              taxId: selectedClient.taxId || '',
              gstin: selectedClient.gstin || '',
              pan: selectedClient.pan || '',
            },
            items: mappedItems,
            currency: currency,
            notes: notes,
            dueDate: new Date(dateVal),
            logoUrl: logoUrl || undefined,
            quotationRef: quotationRef || undefined,
            proformaRef: proformaRef || undefined,
          };
          await updateInvoice.mutateAsync({ id: docId, data: payload as any });
        }
        alert('Document updated successfully!');
      } else {
        if (docType === 'QUOTATION') {
          const payload = {
            documentType: 'QUOTATION' as const,
            documentNumber: docNumber,
            quoteNumber: docNumber,
            clientRef: selectedClientId,
            clientInfo: {
              name: selectedClient.name,
              email: selectedClient.email,
              billingAddress: selectedClient.billingAddress || '',
              taxId: selectedClient.taxId || '',
              gstin: selectedClient.gstin || '',
              pan: selectedClient.pan || '',
            },
            items: mappedItems,
            currency: currency,
            notes: notes,
            status: 'DRAFT' as const,
            issueDate: new Date(),
            validUntil: new Date(dateVal),
            logoUrl: logoUrl || undefined,
          };
          await createQuotation.mutateAsync(payload);
        } else if (docType === 'PROFORMA') {
          const payload = {
            documentType: 'PROFORMA' as const,
            documentNumber: docNumber,
            proformaNumber: docNumber,
            clientRef: selectedClientId,
            clientInfo: {
              name: selectedClient.name,
              email: selectedClient.email,
              billingAddress: selectedClient.billingAddress || '',
              taxId: selectedClient.taxId || '',
              gstin: selectedClient.gstin || '',
              pan: selectedClient.pan || '',
            },
            items: mappedItems,
            currency: currency,
            notes: notes,
            status: 'DRAFT' as const,
            issueDate: new Date(),
            validUntil: new Date(dateVal),
            logoUrl: logoUrl || undefined,
            quotationRef: quotationRef || undefined,
          };
          await createProforma.mutateAsync(payload);
        } else {
          const payload = {
            documentType: 'FINAL_INVOICE' as const,
            documentNumber: docNumber,
            invoiceNumber: docNumber,
            clientRef: selectedClientId,
            clientInfo: {
              name: selectedClient.name,
              email: selectedClient.email,
              billingAddress: selectedClient.billingAddress || '',
              taxId: selectedClient.taxId || '',
              gstin: selectedClient.gstin || '',
              pan: selectedClient.pan || '',
            },
            items: mappedItems,
            currency: currency,
            notes: notes,
            status: 'DRAFT' as const,
            issueDate: new Date(),
            dueDate: new Date(dateVal),
            paymentStatus: 'UNPAID' as const,
            logoUrl: logoUrl || undefined,
            quotationRef: quotationRef || undefined,
            proformaRef: proformaRef || undefined,
          };
          await createInvoice.mutateAsync(payload);
        }
        alert('Document created successfully!');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save document.');
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="header">
        <div className="logo-section">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/website_icon.png" alt="Logo" style={{ height: '36px', width: '36px', objectFit: 'contain' }} />
            Cashflow Billing ERP
          </h1>
          <p>Production-Grade Invoicing & Billing Dashboard</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="view-mode-tabs">
            <button 
              type="button"
              className={`view-mode-btn ${viewMode === 'daily' ? 'active' : ''}`} 
              onClick={() => setViewMode('daily')}
            >
              📅 Daily Workspace
            </button>
            <button 
              type="button"
              className={`view-mode-btn ${viewMode === 'history' ? 'active' : ''}`} 
              onClick={() => setViewMode('history')}
            >
              📜 Archive & History
            </button>
          </div>
          <div className="connection-pill">
            <div className="connection-dot" style={{ backgroundColor: isApiError ? '#f87171' : '#34d399', boxShadow: isApiError ? '0 0 8px #f87171' : '0 0 8px #34d399' }} />
            <span>API: {isApiError ? 'Disconnected' : 'Connected'}</span>
          </div>
        </div>
      </header>

      {/* Global Search Bar (Only in History mode) */}
      {viewMode === 'history' && (
        <div className="search-bar-container">
          <input 
            type="text" 
            placeholder="🔍 Search history by Document #, Client name or email..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      )}

      {/* Metrics Row */}
      <section className="stats-grid">
        <div className="stat-card quotation">
          <div className="stat-header">
            <span>Quotations</span>
            <span style={{ color: 'var(--info)' }}>{activeQuoteCount} {viewMode === 'daily' ? 'Today' : 'Total'}</span>
          </div>
          <div className="stat-value">{formatCurrency(activeQuoteVolume, quotations[0]?.currency || 'INR')}</div>
          <div className="stat-footer">{viewMode === 'daily' ? "Today's pipe volume" : "Estimated sales pipe volume"}</div>
        </div>

        <div className="stat-card proforma">
          <div className="stat-header">
            <span>Proforma Invoices</span>
            <span style={{ color: 'var(--warning)' }}>{activeProformaCount} {viewMode === 'daily' ? 'Today' : 'Total'}</span>
          </div>
          <div className="stat-value">{formatCurrency(activeProformaVolume, proformas[0]?.currency || 'INR')}</div>
          <div className="stat-footer">{viewMode === 'daily' ? "Today's pending" : "Awaiting confirmations"}</div>
        </div>

        <div className="stat-card invoice">
          <div className="stat-header">
            <span>Final Invoices</span>
            <span style={{ color: 'var(--primary)' }}>{activeInvoiceCount} {viewMode === 'daily' ? 'Today' : 'Total'}</span>
          </div>
          <div className="stat-value">{formatCurrency(activeInvoiceVolume, invoices[0]?.currency || 'INR')}</div>
          <div className="stat-footer">{viewMode === 'daily' ? "Today's revenue" : "Total billed revenue"}</div>
        </div>
      </section>

      {/* Lists Section */}
      <section className="lists-container">
        {/* 1. Quotations List */}
        <div>
          <h2 className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><span style={{ color: 'var(--info)' }}>●</span> {viewMode === 'daily' ? "Today's Quotations" : "Quotations Archive"}</span>
            <button className="btn-create" onClick={() => openModal('QUOTATION')}>+ Create</button>
          </h2>
          <div className="document-list">
            <div className="list-header">
              <span>Quote #</span>
              <span>Client</span>
              <span>Valid Until</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {loadingQuotes ? (
              <div className="empty-state">Loading quotations...</div>
            ) : filteredQuotes.length === 0 ? (
              <div className="empty-state">{viewMode === 'daily' ? "No quotations created today." : "No quotations found in history."}</div>
            ) : (
              (filteredQuotes as Quotation[]).map((q: Quotation) => (
                <div key={q.id || q.documentNumber || q.quoteNumber} className="list-row">
                  <span className="doc-number">{q.documentNumber || q.quoteNumber}</span>
                  <div className="client-info">
                    <span className="client-name">{q.clientInfo.name}</span>
                    <span className="client-email">{q.clientInfo.email}</span>
                  </div>
                  <span className="doc-date">{formatDate(q.validUntil)}</span>
                  <span className="doc-amount">{formatCurrency(q.totalAmount, q.currency)}</span>
                  <div>
                    <span className={`status-badge ${q.status.toLowerCase()}`}>{q.status}</span>
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button className="btn-print" title="Print Quotation" onClick={() => setPrintDoc(q)}>🖨️</button>
                      <button className="btn-status-action text-info" title="Edit Quotation" onClick={() => openEditModal(q)}>✏️</button>
                      <button className="btn-status-action text-danger" title="Delete Quotation" onClick={() => handleDeleteDoc(q.id || (q as any)._id, 'QUOTATION')}>🗑️</button>
                      {q.status !== 'CONVERTED' && q.status !== 'DECLINED' && (
                        <>
                          <button className="btn-status-action text-success" title="Accept & Convert to Proforma" onClick={() => handleConvertQuote(q.id || (q as any)._id)}>✅</button>
                          <button className="btn-status-action text-danger" title="Decline Quote" onClick={() => handleUpdateQuoteStatus(q.id || (q as any)._id, 'DECLINED')}>❌</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Proforma Invoices List */}
        <div>
          <h2 className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><span style={{ color: 'var(--warning)' }}>●</span> {viewMode === 'daily' ? "Today's Proformas" : "Proformas Archive"}</span>
            <button className="btn-create" onClick={() => openModal('PROFORMA')}>+ Create</button>
          </h2>
          <div className="document-list">
            <div className="list-header">
              <span>Proforma #</span>
              <span>Client</span>
              <span>Valid Until</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {loadingProformas ? (
              <div className="empty-state">Loading proforma invoices...</div>
            ) : filteredProformas.length === 0 ? (
              <div className="empty-state">{viewMode === 'daily' ? "No proforma invoices created today." : "No proforma invoices found in history."}</div>
            ) : (
              (filteredProformas as ProformaInvoice[]).map((p: ProformaInvoice) => (
                <div key={p.id || p.documentNumber || p.proformaNumber} className="list-row">
                  <span className="doc-number">{p.documentNumber || p.proformaNumber}</span>
                  <div className="client-info">
                    <span className="client-name">{p.clientInfo.name}</span>
                    <span className="client-email">{p.clientInfo.email}</span>
                  </div>
                  <span className="doc-date">{formatDate(p.validUntil)}</span>
                  <span className="doc-amount">{formatCurrency(p.totalAmount, p.currency)}</span>
                  <div>
                    <span className={`status-badge ${p.status.toLowerCase()}`}>{p.status}</span>
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button className="btn-print" title="Print Proforma" onClick={() => setPrintDoc(p)}>🖨️</button>
                      <button className="btn-status-action text-info" title="Edit Proforma" onClick={() => openEditModal(p)}>✏️</button>
                      <button className="btn-status-action text-danger" title="Delete Proforma" onClick={() => handleDeleteDoc(p.id || (p as any)._id, 'PROFORMA')}>🗑️</button>
                      {p.status !== 'CONVERTED' && (
                        <button className="btn-status-action text-success" title="Confirm Payment & Convert to Invoice" onClick={() => handleConvertProforma(p.id || (p as any)._id)}>✅</button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Final Invoices List */}
        <div>
          <h2 className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><span style={{ color: 'var(--primary)' }}>●</span> {viewMode === 'daily' ? "Today's Final Invoices" : "Final Invoices Archive"}</span>
            <button className="btn-create" onClick={() => openModal('FINAL_INVOICE')}>+ Create</button>
          </h2>
          <div className="document-list">
            <div className="list-header">
              <span>Invoice #</span>
              <span>Client</span>
              <span>Due Date</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {loadingInvoices ? (
              <div className="empty-state">Loading final invoices...</div>
            ) : filteredInvoices.length === 0 ? (
              <div className="empty-state">{viewMode === 'daily' ? "No final invoices created today." : "No final invoices found in history."}</div>
            ) : (
              (filteredInvoices as FinalInvoice[]).map((i: FinalInvoice) => (
                <div key={i.id || i.documentNumber || i.invoiceNumber} className="list-row">
                  <span className="doc-number">{i.documentNumber || i.invoiceNumber}</span>
                  <div className="client-info">
                    <span className="client-name">{i.clientInfo.name}</span>
                    <span className="client-email">{i.clientInfo.email}</span>
                  </div>
                  <span className="doc-date">{formatDate(i.dueDate)}</span>
                  <span className="doc-amount">{formatCurrency(i.totalAmount, i.currency)}</span>
                  <div>
                    <span className={`status-badge ${i.status.toLowerCase()}`}>{i.status}</span>
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button className="btn-print" title="Print Invoice" onClick={() => setPrintDoc(i)}>🖨️</button>
                      <button className="btn-status-action text-info" title="Edit Invoice" onClick={() => openEditModal(i)}>✏️</button>
                      <button className="btn-status-action text-danger" title="Delete Invoice" onClick={() => handleDeleteDoc(i.id || (i as any)._id, 'FINAL_INVOICE')}>🗑️</button>
                      {i.status !== 'PAID' && (
                        <button className="btn-status-action text-success" title="Mark Paid" onClick={() => handleMarkInvoicePaid(i.id || (i as any)._id)}>💰</button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* FLOATING CREATION/EDIT MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <form onSubmit={handleSubmit} className="modal-card">
            <div className="modal-header">
              <h3>{editingDoc ? 'Edit' : 'Create New'} {docType === 'QUOTATION' ? 'Quotation' : docType === 'PROFORMA' ? 'Proforma Invoice' : 'Final Invoice'}</h3>
              <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
                {/* Import from existing documents (Only on creation) */}
                {!editingDoc && (docType === 'PROFORMA' || docType === 'FINAL_INVOICE') && (
                  <div className="form-row" style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
                    {docType === 'PROFORMA' && (
                      <div className="form-group">
                        <label>Import details from Quotation</label>
                        <select
                          className="form-select"
                          value={quotationRef}
                          onChange={(e) => handleImportQuotation(e.target.value)}
                        >
                          <option value="">-- Select Quotation to Import --</option>
                          {quotations.map(q => (
                            <option key={q.id || (q as any)._id} value={q.id || (q as any)._id}>
                              {q.documentNumber || (q as any).quoteNumber} - {q.clientInfo.name} ({formatCurrency(q.totalAmount, q.currency)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {docType === 'FINAL_INVOICE' && (
                      <>
                        <div className="form-group">
                          <label>Import details from Quotation</label>
                          <select
                            className="form-select"
                            value={quotationRef}
                            onChange={(e) => handleImportQuotation(e.target.value)}
                          >
                            <option value="">-- Select Quotation to Import --</option>
                            {quotations.map(q => (
                              <option key={q.id || (q as any)._id} value={q.id || (q as any)._id}>
                                {q.documentNumber || (q as any).quoteNumber} - {q.clientInfo.name} ({formatCurrency(q.totalAmount, q.currency)})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Import details from Proforma</label>
                          <select
                            className="form-select"
                            value={proformaRef}
                            onChange={(e) => handleImportProforma(e.target.value)}
                          >
                            <option value="">-- Select Proforma to Import --</option>
                            {proformas.map(p => (
                              <option key={p.id || (p as any)._id} value={p.id || (p as any)._id}>
                                {p.documentNumber || (p as any).proformaNumber} - {p.clientInfo.name} ({formatCurrency(p.totalAmount, p.currency)})
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Client selection row */}
                <div className="form-group">
                  <label>Client</label>
                  {!isCreatingClient ? (
                    <div className="client-selection-row">
                      <select
                        className="form-select"
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        required
                      >
                        <option value="">-- Select Client --</option>
                        {clients.map((c) => (
                          <option key={c.id || (c as any)._id} value={c.id || (c as any)._id}>
                            {c.name} ({c.email})
                          </option>
                        ))}
                      </select>
                      <button className="btn-inline-action" onClick={(e) => { e.preventDefault(); setIsCreatingClient(true); }}>
                        + New Client
                      </button>
                    </div>
                  ) : (
                    <div className="inline-client-card">
                      <h4>Register New Client inline</h4>
                      <div className="form-row">
                        <div className="form-group">
                          <input
                            type="text"
                            placeholder="Client Name *"
                            className="form-input"
                            value={newClientData.name}
                            onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <input
                            type="email"
                            placeholder="Client Email *"
                            className="form-input"
                            value={newClientData.email}
                            onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="form-row" style={{ marginTop: '0.5rem' }}>
                        <div className="form-group">
                          <input
                            type="text"
                            placeholder="Tax ID / Registration Code *"
                            className="form-input"
                            value={newClientData.taxId}
                            onChange={(e) => setNewClientData({ ...newClientData, taxId: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <input
                            type="text"
                            placeholder="Billing Address"
                            className="form-input"
                            value={newClientData.billingAddress}
                            onChange={(e) => setNewClientData({ ...newClientData, billingAddress: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="form-row" style={{ marginTop: '0.5rem' }}>
                        <div className="form-group">
                          <input
                            type="text"
                            placeholder="GSTIN"
                            className="form-input"
                            value={newClientData.gstin}
                            onChange={(e) => setNewClientData({ ...newClientData, gstin: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <input
                            type="text"
                            placeholder="PAN"
                            className="form-input"
                            value={newClientData.pan}
                            onChange={(e) => setNewClientData({ ...newClientData, pan: e.target.value })}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary-action" style={{ padding: '0.4rem 1rem' }} onClick={(e) => { e.preventDefault(); setIsCreatingClient(false); }}>
                          Cancel
                        </button>
                        <button className="btn-primary-action" style={{ padding: '0.4rem 1.25rem' }} onClick={handleCreateClient}>
                          Save Client
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Doc Details */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Document Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{docType === 'FINAL_INVOICE' ? 'Due Date' : 'Valid Until'}</label>
                    <input
                      type="date"
                      className="form-input"
                      value={dateVal}
                      onChange={(e) => setDateVal(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Currency</label>
                    <select
                      className="form-select"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Thank you for your business"
                      className="form-input"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>


                {/* Items Section */}
                <div className="items-section-title">Line Items</div>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', marginBottom: '1.25rem' }}>
                  <table className="items-table" style={{ minWidth: '700px', margin: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ width: '32%' }}>Description *</th>
                        <th style={{ width: '13%' }}>HSN/SAC</th>
                        <th style={{ width: '10%' }}>Qty</th>
                        <th style={{ width: '12%' }}>Price *</th>
                        <th style={{ width: '10%' }}>Disc (%)</th>
                        <th style={{ width: '10%' }}>Tax (%)</th>
                        <th style={{ width: '10%', textAlign: 'right' }}>Total</th>
                        <th style={{ width: '3%' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => {
                        const baseVal = getItemQty(item.quantity) * item.price;
                        const discAmt = baseVal * ((Number(item.discountPercent) || 0) / 100);
                        const itemSubTotal = baseVal - discAmt;
                        const itemTax = itemSubTotal * (item.taxRate / 100);
                        const itemTotal = itemSubTotal + itemTax;
                        return (
                          <tr key={idx} className="item-row">
                            <td>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                placeholder="Service / Product name"
                                required
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={item.hsnSac}
                                onChange={(e) => handleItemChange(idx, 'hsnSac', e.target.value)}
                                placeholder="998311"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={item.quantity === undefined || item.quantity === null ? '' : item.quantity}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || /^\d*$/.test(val)) {
                                    let cleaned = val;
                                    if (/^0\d+/.test(val)) {
                                      cleaned = val.replace(/^0+/, '');
                                    }
                                    handleItemChange(idx, 'quantity', cleaned === '' ? undefined : Number(cleaned));
                                  }
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={item.price === 0 ? '' : item.price}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                    let cleaned = val;
                                    if (/^0\d+/.test(val) && !val.startsWith('0.')) {
                                      cleaned = val.replace(/^0+/, '');
                                    }
                                    handleItemChange(idx, 'price', cleaned === '' ? 0 : Number(cleaned));
                                  }
                                }}
                                placeholder="0.00"
                                required
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={item.discountPercent === 0 ? '' : item.discountPercent}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                    let cleaned = val;
                                    if (/^0\d+/.test(val) && !val.startsWith('0.')) {
                                      cleaned = val.replace(/^0+/, '');
                                    }
                                    handleItemChange(idx, 'discountPercent', cleaned === '' ? 0 : Number(cleaned));
                                  }
                                }}
                                placeholder="0"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={item.taxRate === 0 ? '' : item.taxRate}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || /^\d*$/.test(val)) {
                                    let cleaned = val;
                                    if (/^0\d+/.test(val)) {
                                      cleaned = val.replace(/^0+/, '');
                                    }
                                    handleItemChange(idx, 'taxRate', cleaned === '' ? 0 : Number(cleaned));
                                  }
                                }}
                              />
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '500' }}>
                              {formatCurrency(itemTotal, currency)}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-delete-item"
                                disabled={items.length === 1}
                                onClick={() => handleRemoveItem(idx)}
                              >
                                &times;
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <button type="button" className="btn-inline-action" onClick={handleAddItem}>
                  + Add Item
                </button>

                {/* Totals Summary */}
                <div className="totals-summary">
                  <div>Subtotal: {formatCurrency(formSubTotal, currency)}</div>
                  <div>Tax Amount: {formatCurrency(formTaxAmount, currency)}</div>
                  <div className="grand-total">Total: {formatCurrency(formTotalAmount, currency)}</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary-action" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  disabled={createQuotation.isPending || createProforma.isPending || createInvoice.isPending || updateQuotation.isPending || updateProforma.isPending || updateInvoice.isPending}
                >
                  {createQuotation.isPending || createProforma.isPending || createInvoice.isPending || updateQuotation.isPending || updateProforma.isPending || updateInvoice.isPending ? 'Saving...' : editingDoc ? 'Save Changes' : 'Create Document'}
                </button>
              </div>
          </form>
        </div>
      )}

      {/* FLOATING PRINT PREVIEW MODAL */}
      {printDoc && (
        <div className="modal-overlay print-overlay">
          <div className="modal-card print-preview-card">
            <div className="modal-header no-print">
              <h3>Print Preview</h3>
              <button type="button" className="btn-close" onClick={() => setPrintDoc(null)}>&times;</button>
            </div>
            <div className="modal-body" style={{ background: '#f8f9fa', padding: 0 }}>
              {renderAuditTrail(printDoc)}
              <iframe
                ref={iframeRef}
                title="Print Preview"
                style={{ width: '100%', height: '700px', border: 'none', background: '#fff', display: 'block' }}
                srcDoc={generateDocumentHtml(getDocumentData(printDoc))}
              />
              <div className="print-area" style={{ display: 'none' }} dangerouslySetInnerHTML={{ __html: generateDocumentHtml(getDocumentData(printDoc)) }} />
            </div>
            <div className="modal-footer no-print">
              <button type="button" className="btn-secondary-action" onClick={() => setPrintDoc(null)}>Close</button>
              {printDoc.documentType === 'QUOTATION' && printDoc.status !== 'CONVERTED' && (
                <>
                  <button type="button" className="btn-primary-action" style={{ background: '#eab308', borderColor: '#eab308' }} onClick={() => handleConvertQuote(printDoc.id || (printDoc as any)._id)}>
                    Convert to Proforma
                  </button>
                  <button type="button" className="btn-primary-action" style={{ background: '#3b82f6', borderColor: '#3b82f6' }} onClick={() => handleConvertQuoteToInvoiceDirect(printDoc.id || (printDoc as any)._id)}>
                    Convert to Final Invoice
                  </button>
                </>
              )}
              {printDoc.documentType === 'PROFORMA' && printDoc.status !== 'CONVERTED' && (
                <button type="button" className="btn-primary-action" style={{ background: '#f97316', borderColor: '#f97316' }} onClick={() => handleConvertProforma(printDoc.id || (printDoc as any)._id)}>
                  Convert to Final Invoice
                </button>
              )}
              <button type="button" className="btn-primary-action" onClick={handlePrint}>Print / Save PDF</button>
            </div>
          </div>
        </div>
      )}

      {isApiLoading && (
        <div className="global-loader-overlay">
          <div className="global-loader-spinner-container">
            <div className="global-loader-spinner"></div>
            <p className="global-loader-text">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
}
