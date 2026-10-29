import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash, Plus, Edit, X, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { getPublicSettings } from "@/lib/public.functions";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/orcamento")({
  component: BudgetPage,
  head: () => ({
    meta: [
      { title: "Orçamento — Santana Brindes" },
      { name: "description", content: "Gerar orçamento de brindes personalizados" },
    ],
  }),
});

function fmtBRL(value: number | string) {
  const num = typeof value === "string" ? Number(value.replace("R$ ", "").replace(",", ".")) : Number(value);
  if (isNaN(num)) return "R$ 0,00";
  return "R$ " + num.toFixed(2).replace(".", ",");
}

function formatNumberBR(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

export function BudgetPage() {
  const navigate = useNavigate();
  const { items: cartItems, total: cartTotal, isLoading, update: cartUpdate, remove: cartRemove } = useCart();
  const settingsFn = useServerFn(getPublicSettings);
  const { data: settings } = useQuery({ queryKey: ["public-settings"], queryFn: () => settingsFn() });
  const [submitting, setSubmitting] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [budgetDate, setBudgetDate] = useState<Date | null>(null);
  const [budgetNumber, setBudgetNumber] = useState("");
  const [items, setItems] = useState<Array<{ id: string; name: string; quantity: number; unitPrice: number; total: number }>>([]);
  const [discountType, setDiscountType] = useState("fixed");
  const [discountValue, setDiscountValue] = useState("0");
  const [freightValue, setFreightValue] = useState("0");
  const [productionDeadline, setProductionDeadline] = useState("");
  const [validityDays, setValidityDays] = useState("30");
  const [paymentMethod, setPaymentMethod] = useState("À vista");
  const [observations, setObservations] = useState("");

  const [newProductName, setNewProductName] = useState("");
  const [newProductQty, setNewProductQty] = useState("1");
  const [newProductPrice, setNewProductPrice] = useState("0");
  const [editingItem, setEditingItem] = useState<string | null>(null);

  // Calculated totals
  const calculateItemTotal = (quantity: number, unitPrice: number) => quantity * unitPrice;

  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item.quantity, item.unitPrice), 0);
  const discount = discountValue ? (discountType === "percentage" ? Math.round(subtotal * (Number(discountValue) / 100)) : Number(discountValue)) : 0;
  const freight = freightValue ? Number(freightValue) : 0;
  const grandTotal = subtotal - discount + freight;

  // Gerar número automaticamente
  useEffect(() => {
    const today = new Date();
    setBudgetDate(today);
    setBudgetNumber(`ORC-${today.getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`);
  }, []);

  // Adicionar produto
  const addProduct = () => {
    if (!newProductName.trim()) {
      toast.error("Informe o nome do produto");
      return;
    }
    if (Number(newProductQty) <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }
    if (Number(newProductPrice) <= 0) {
      toast.error("Valor unitário deve ser maior que zero");
      return;
    }

    const newItem = {
      id: Date.now().toString() + Math.random().toString().slice(2),
      name: newProductName.trim(),
      quantity: Number(newProductQty),
      unitPrice: Number(newProductPrice),
      total: calculateItemTotal(Number(newProductQty), Number(newProductPrice)),
    };

    setItems((prev) => [...prev, newItem]);
    setNewProductName("");
    setNewProductQty("1");
    setNewProductPrice("0");
  };

  // Remover produto
  const removeProduct = (id: string) => setItems((prev) => prev.filter((item) => item.id !== id));

  // Iniciar edição
  const startEdit = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    setEditingItem(itemId);
    setNewProductName(item.name);
    setNewProductQty(item.quantity.toString());
    setNewProductPrice(item.unitPrice.toFixed(2));
  };

  // Salvar edição
  const saveEdit = () => {
    if (!editingItem || !newProductName.trim()) return;
    setItems((prev) =>
      prev.map((item) => (item.id === editingItem ? { ...item, name: newProductName.trim() } : item))
    );
    setEditingItem(null);
    setNewProductName("");
    setNewProductQty("1");
    setNewProductPrice("0");
  };

  // Handle checkout / gerar orçamento
  const handleCheckout = async () => {
    if (!clientName.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }
    if (!clientPhone.trim()) {
      toast.error("Informe o telefone/WhatsApp");
      return;
    }
    if (items.length === 0) {
      toast.error("Adicione pelo menos um produto ao orçamento");
      return;
    }

    try {
      const pdfBlob = await generatePdf(budgetData);
      if (!pdfBlob) {
        toast.error("Falha ao gerar PDF");
        return;
      }

      // Native share
      const hasNativeShare = typeof navigator !== "undefined" && navigator.share;

      if (hasNativeShare) {
        try {
          await navigator.share({
            title: "Orçamento Santana Brindes",
            text: `Orçamento #${budgetNumber} - Total: ${fmtBRL(grandTotal)}`,
            files: [new Blob([pdfBlob], { type: "application/pdf" })],
          });
          toast.success("Orçamento compartilhado via nativo!");
        } catch (e) {
          const blob = new Blob([pdfBlob], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `orcamento-${budgetNumber}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success("PDF gerado e pronto para download");
        }
      } else {
        // Download PDF
        const blob = new Blob([pdfBlob], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `orcamento-${budgetNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("PDF gerado e pronto para download");

        // WhatsApp share
        const waMessage = `Olá! Gostaria de solicitar um orçamento da Santana Brindes.\n\n`
          + `Orçamento #${budgetNumber}\n`
          + `Cliente: ${clientName}\n`
          + `Telefone: ${clientPhone}\n`
          + `Produtos: ${items.length} item(ns)\n`
          + `Total: ${fmtBRL(grandTotal)}\n\n`
          + `${observations || ""}`;

        const waPhone = settings?.whatsapp?.phone_number ? String(settings.whatsapp.phone_number).replace(/\D/g, "") : null;
        if (waPhone) {
          const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`;
          window.open(waUrl, "_blank");
          toast.success("Abrindo WhatsApp para compartilhamento");
        } else {
          toast.error("Configure o número do WhatsApp em Admin › Configurações");
        }
      }
    } catch (e: any) {
      toast.error("Erro ao gerar PDF: " + e.message);
    }
  };

  // Dados para o PDF
  const budgetData = {
    client_name: clientName.trim(),
    client_phone: clientPhone.trim(),
    client_email: clientEmail.trim() || null,
    budget_number: budgetNumber.trim(),
    budget_date: budgetDate?.toISOString() || new Date().toISOString(),
    items: items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: item.total,
    })),
    subtotal,
    discount,
    discount_type: discountType,
    freight,
    grand_total: grandTotal,
    production_deadline: productionDeadline || null,
    validity_days: Number(validityDays) || 30,
    payment_method: paymentMethod,
    observations: observations.trim() || null,
  };

  // Gerar PDF profissional
  const generatePdf = async (data: any) => {
    return new Promise<Blob>((resolve) => {
      const doc = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 25;
      const marginRight = 25;
      const marginTop = 25;
      const marginBottom = 25;
      const usableWidth = pageWidth - marginLeft - marginRight;

      let currentY = marginTop;

      // Helper: texto com quebra de linha
      const writeSizedText = (
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        fontSize: number = 9,
        lineHeight: number = 1.4
      ) => {
        const words = text.split(" ");
        let line = "";
        let lineY = y;

        for (const word of words) {
          const testLine = line + (line ? " " : "") + word;
          const metrics = doc.getTextDimensions(testLine);
          if (metrics.width > maxWidth && line) {
            doc.text(line, x, lineY);
            lineY += fontSize * lineHeight;
            line = word;
          } else {
            line = testLine;
          }
        }
        if (line) {
          doc.text(line, x, lineY);
        }
        return lineY;
      };

      // Logo/Head
      currentY = writeSizedText(
        "Santana Brindes",
        marginLeft,
        currentY,
        usableWidth,
        22,
        1.1
      );
      currentY += 8;
      currentY = writeSizedText(
        "Orçamento Comercial",
        marginLeft,
        currentY,
        usableWidth,
        13,
        1.3
      );
      currentY += 18;

      // Dados do cliente
      doc.setFontSize(8);
      doc.setTextColor(60);
      doc.text("Dados do Cliente", marginLeft, currentY);
      currentY += 6;
      doc.setTextColor(30);
      doc.setFontSize(8);
      const clientInfo: string[] = [
        `Cliente: ${data.client_name}`,
        `Telefone: ${data.client_phone}`,
        data.client_email ? `E-mail: ${data.client_email}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
      doc.text(clientInfo, marginLeft, currentY);
      currentY += 14;

      // Tabela de produtos
      const columnNames = ["Produto", "Qtd", "Vl. Unit.", "Total"];
      const colWidths = [usableWidth * 0.55, 18, 22, 22];

      const productRows = data.items.map((item: any) => [
        item.name.length > 40 ? item.name.substring(0, 37) + "..." : item.name,
        item.quantity.toString(),
        formatNumberBR(item.unit_price),
        formatNumberBR(item.total),
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [columnNames],
        body: productRows,
        theme: "striped",
        headStyle: { fillColor: [30, 60, 110], textColor: 255 },
        alternateRowStyle: { fillColor: [240, 245, 250] },
        margins: { left: marginLeft, right: marginRight },
        columnWidths: colWidths.map((w: number) => Math.max(w, 20)),
        styles: { fontSize: 7, cellPadding: 3, textColor: 30 },
        headStyles: { fontSize: 7, fillColor: [30, 60, 110], textColor: 255 },
        verticalSpacing: 3,
        columnLineWidth: 0.4,
        didDrawCell: (cell: any) => {
          if (cell.column.dataKey === "Produto") {
            doc.setFillColor(255, 255, 255);
            doc.rect(cell.cell.x, cell.cell.y, cell.cell.width, cell.cell.height, "F");
          }
        },
      });
      currentY = (doc as any).lastAutoTable.finalY + 14;

      // Totais
      const totalRows = [
        ["Subtotal", formatNumberBR(data.subtotal)],
        ["Desconto (" + data.discount_type + ")", formatNumberBR(data.discount)],
        ["Frete", formatNumberBR(data.freight)],
        ["TOTAL", formatNumberBR(data.grand_total)],
      ];

      autoTable(doc, {
        startY: currentY,
        body: [totalRows[3]],
        foot: totalRows.slice(0, 3).map((row: string[]) => row),
        theme: "plain",
        headStyle: { fillColor: [30, 60, 110] },
        footStyle: { fillColor: [220, 20, 60], textColor: 255, fontStyle: "bold" },
        startFoot: true,
        margins: { left: marginLeft, right: marginRight },
        styles: { fontSize: 8, cellPadding: 6, fontStyle: "normal" },
        footStyles: { fontSize: 8, fillColor: [220, 20, 60], textColor: 255, fontStyle: "bold" },
        columnWidths: [usableWidth * 0.4, usableWidth * 0.25],
      });
      currentY = (doc as any).lastAutoTable.finalY + 18;

      // Informações adicionais
      const additionalLines: string[] = [];
      if (data.production_deadline) additionalLines.push(`Prazo de Produção: ${data.production_deadline}`);
      additionalLines.push(`Validade: ${data.validity_days} dias`);
      additionalLines.push(`Forma de Pagamento: ${data.payment_method}`);
      if (data.observations) additionalLines.push(`Observações: ${data.observations}`);

      additionalLines.forEach((line) => {
        if (currentY > pageHeight - 30) {
          doc.addPage();
          currentY = marginTop;
        }
        doc.setFontSize(7.5);
        doc.setTextColor(50);
        doc.text(line, marginLeft, currentY);
        currentY += 7;
      });

      // Rodapé
      doc.setFontSize(7);
      doc.setTextColor(120);
      doc.text("Santana Brindes - Todos os direitos reservados", marginLeft, pageHeight - 10);

      const pdfOutput = doc.output("blob");
      resolve(pdfOutput);
    });
  };

  // Render
  return (
    <div className="min-h-screen bg-background">
      {/* ===== HEADER ===== */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <svg
                className="h-6 w-6 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-foreground">Novo Orçamento</h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {budgetNumber || "—"}
            </span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setItems([]);
                setClientName("");
                setClientPhone("");
                setClientEmail("");
                setBudgetNumber(`ORC-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`);
                setDiscountType("fixed");
                setDiscountValue("0");
                setFreightValue("0");
                setProductionDeadline("");
                setValidityDays("30");
                setPaymentMethod("À vista");
                setObservations("");
                setEditingItem(null);
                setNewProductName("");
                setNewProductQty("1");
                setNewProductPrice("0");
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-140px)] bg-background">
        <div class="max-w-7xl mx-auto">
          {/* ===== LINHA PRINCIPAL (2 colunas no desktop) ===== */}
          <div class="grid lg:grid-cols-12 gap-6 items-start">

            {/* --- COLUNA ESQUERDA --- */}
            <div className="lg:col-span-8 space-y-4">

              {/* --- DADOS DO CLIENTE --- */}
              <div className="border rounded-xl p-5 bg-card">
                <h2 className="font-semibold mb-3">Dados do Cliente</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nome*</Label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Nome da empresa ou cliente"
                      required
                    />
                  </div>
                  <div>
                    <Label>WhatsApp*</Label>
                    <Input
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="(00) 90000-0000"
                      maxLength={15}
                      required
                      inputMode="tel"
                    />
                  </div>
                  <div className="col-span-2 sm:col-1">
                    <Label>E-mail</Label>
                    <Input
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      type="email"
                      placeholder="exemplo@email.com"
                    />
                  </div>
                  <div>
                    <Label>Data*</Label>
                    <Input
                      type="date"
                      value={budgetDate?.toISOString().split("T")[0] || ""}
                      onChange={(e) => setBudgetDate(new Date(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <Label>Número</Label>
                    <Input
                      value={budgetNumber}
                      onChange={(e) => setBudgetNumber(e.target.value)}
                      readOnly
                    />
                    <small className="text-xs text-muted-foreground">
                      Gerado automaticamente
                    </small>
                  </div>
                </div>
              </div>

              {/* --- PRODUTOS --- */}
              <div className="border rounded-xl p-5 bg-card">
                <h2 className="font-semibold mb-3">Produtos do Orçamento</h2>

                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                ) : items.length === 0 ? (
                  <div className="border rounded-lg p-8 text-center text-muted-foreground">
                    <p>Nenhum produto adicionado ainda.</p>
                    <Button
                      onClick={() => setItems([])}
                      className="my-3 w-auto px-4"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Adicionar primeiro produto
                    </Button>
                  </div>
                ) : (
                  <>

                    {/* Tabela de produtos usando ul/li */}
                    <div className="overflow-x-auto">
                      <ul className="divide-y border rounded-lg">
                        {items.map((item) => {
                          if (editingItem === item.id) {
                            return (
                              <li key={item.id} className="border-y p-3 flex gap-3 items-center">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium line-clamp-2">
                                    <Input
                                      value={newProductName || item.name}
                                      onChange={(e) => setNewProductName(e.target.value)}
                                      placeholder="Nome do produto"
                                    />
                                  </div>
                                </div>
                                <div className="w-24">
                                  <Label>Qty</Label>
                                  <Input
                                    type="number"
                                    value={newProductQty || item.quantity.toString()}
                                    onChange={(e) => {
                                      const val = Math.max(1, Number(e.target.value));
                                      setNewProductQty(val.toString());
                                    }}
                                    min={1}
                                  />
                                </div>
                                <div>
                                  <Label>Vlr. Unit.</Label>
                                  <Input
                                    inputMode="decimal"
                                    value={newProductPrice || item.unitPrice.toFixed(2)}
                                    onChange={(e) => {
                                      const val = Number(e.target.value.replace("R$ ", "").replace(",", ".")) || 0;
                                      setNewProductPrice(val.toFixed(2));
                                    }}
                                  />
                                </div>
                                <div className="flex-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => saveEdit()}
                                  >
                                    <Check className="h-4 w-4" /> Confirmar
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingItem(null);
                                      setNewProductName("");
                                      setNewProductQty("1");
                                      setNewProductPrice("0");
                                    }}
                                  >
                                    <X className="h-4 w-4" /> Cancelar
                                  </Button>
                                </div>
                              </li>
                            );
                          }

                          return (
                            <li key={item.id} className="border-y p-3 flex gap-3 items-center">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium line-clamp-2">{item.name}</div>
                              </div>
                              <div className="w-24">
                                <Label>Qty</Label>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const val = Math.max(1, Number(e.target.value));
                                    setItems((prev) =>
                                      prev.map((i) => (i.id === item.id ? { ...i, quantity: val } : i))
                                    );
                                  }}
                                  min={1}
                                />
                              </div>
                              <div>
                                <Label>Vlr. Unit.</Label>
                                <Input
                                  inputMode="decimal"
                                  value={fmtBRL(item.unitPrice)}
                                  onChange={(e) => {
                                    const val = Number(e.target.value.replace("R$ ", "").replace(",", ".")) || 0;
                                    setItems((prev) =>
                                      prev.map((i) => (i.id === item.id ? { ...i, unitPrice: val } : i))
                                    );
                                  }}
                                />
                              </div>
                              <div className="w-20 text-right text-sm font-semibold">{fmtBRL(item.total)}</div>
                              <div className="flex-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => startEdit(item.id)}
                                >
                                  <Edit className="h-4 w-4" /> Editar
                                </Button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* Formulário de adicionar produto */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid gap-3">
                        <Input
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          placeholder="Nome ou descrição do produto"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            value={newProductQty}
                            onChange={(e) => setNewProductQty(e.target.value)}
                            min={1}
                          />
                          <span>x</span>
                          <Input
                            inputMode="decimal"
                            value={newProductPrice}
                            onChange={(e) => setNewProductPrice(e.target.value)}
                            placeholder="0,00"
                          />
                          <span>R$</span>
                        </div>
                        <Button onClick={addProduct} className="col-span-2 sm:col-auto px-4 py-2">
                          <Plus className="h-4 w-4 mr-1" /> Adicionar produto
                        </Button>
                      </div>
                    </div>
                  </>
                )
              </div>

              <div className="mt-4">
                <h2 className="font-semibold mb-3">Resumo do Orçamento</h2>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="font-bold">{fmtBRL(subtotal)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm text-muted-foreground">Desconto</span>
                    <span
                      className={discount > 0 ? "text-red-600" : "text-muted-foreground"}
                    >
                      {fmtBRL(discount)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm text-muted-foreground">Frete</span>
                    <span
                      className={freight > 0 ? "text-blue-500" : "text-muted-foreground"}
                    >
                      {fmtBRL(freight)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <span></span>
                    <span className="font-bold text-lg">{fmtBRL(grandTotal)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm text-muted-foreground">Validade</span>
                    <Input
                      value={validityDays}
                      onChange={(e) => setValidityDays(e.target.value)}
                      placeholder="30"
                      size="sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm text-muted-foreground">Pagamento</span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      size="sm"
                    >
                      <option value="À vista">À vista</option>
                      <option value="Parcelado">Parcelado</option>
                      <option value="Financiamento">Financiamento</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-sm text-muted-foreground">Prazo Produção</span>
                    <Input
                      value={productionDeadline}
                      onChange={(e) => setProductionDeadline(e.target.value)}
                      placeholder="Ex.: 15 dias"
                      size="sm"
                    />
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      rows={2}
                      placeholder="Observações adicionais..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- COLUNA DIREITA (resumo no desktop) --- */}
            <div className="lg:col-span-4 sticky top-6 lg:top-auto">
              <div className="border rounded-xl p-6 bg-card h-fit">
                <h3 className="font-semibold mb-4 text-center">Resumo do Orçamento</h3>

                <div className="space-y-4">
                  {/* Número do Orçamento */}
                  <div>
                    <p className="text-sm text-muted-foreground">Número do Orçamento</p>
                    <p className="font-medium mt-1">{budgetNumber}</p>
                  </div>

                  {/* Subtotal */}
                  <div>
                    <p className="text-xs text-muted-foreground">Subtotal</p>
                    <p className="font-bold h-10">{fmtBRL(subtotal)}</p>
                  </div>

                  {/* Desconto */}
                  <div>
                    <p className="text-xs text-muted-foreground">Desconto</p>
                    <p
                      className={discount > 0 ? "text-red-600" : "text-muted-foreground"}
                      className="font-medium h-10"
                    >
                      {fmtBRL(discount)}
                    </p>
                  </div>

                  {/* Frete */}
                  <div>
                    <p className="text-xs text-muted-foreground">Frete</p>
                    <p className="font-medium h-10">
                      {fmtBRL(freight)}
                    </p>
                  </div>

                  {/* TOTAL GERAL destacado */}
                  <div>
                    <p className="text-xs text-muted-foreground">TOTAL</p>
                    <p className="font-bold text-lg h-14 text-primary">
                      {fmtBRL(grandTotal)}
                    </p>
                  </div>

                  {/* Botões de ação */}
                  <div className="pt-3 border-t">
                    <Button
                      onClick={handleCheckout}
                      disabled={submitting}
                      className="w-full px-4 py-3 font-medium"
                      style={{ background: "var(--brand-primary)", color: "white" }}
                    >
                      {submitting ? "Gerando..." : "Gerar Orçamento"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}