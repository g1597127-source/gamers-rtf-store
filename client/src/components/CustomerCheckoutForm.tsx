import { useState } from "react";
import { X } from "lucide-react";
import { isValidBirthDate, isValidCpf } from "@shared/customer";

export type CustomerFormData = {
  fullName: string;
  cpf: string;
  birthDate: string;
  address: string;
  phone: string;
  email: string;
};

const emptyForm: CustomerFormData = { fullName: "", cpf: "", birthDate: "", address: "", phone: "", email: "" };

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits.length > 10 ? digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3") : digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
}

export default function CustomerCheckoutForm({ onSubmit, onCancel, isPending, error }: { onSubmit: (data: CustomerFormData) => void; onCancel?: () => void; isPending?: boolean; error?: string }) {
  const [form, setForm] = useState<CustomerFormData>(emptyForm);
  const [validationError, setValidationError] = useState("");
  const update = (field: keyof CustomerFormData, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (form.fullName.trim().length < 3) return setValidationError("Informe seu nome completo.");
    if (!isValidCpf(form.cpf)) return setValidationError("CPF inválido. Confira os 11 dígitos informados.");
    if (!isValidBirthDate(form.birthDate)) return setValidationError("Informe uma data de nascimento válida para uma pessoa maior de 18 anos.");
    if (form.address.trim().length < 8) return setValidationError("Informe o endereço completo para entrega.");
    if (!/^(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4,5}-?\d{4}$/.test(form.phone)) return setValidationError("Informe um telefone brasileiro válido com DDD.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setValidationError("Informe um e-mail válido.");
    setValidationError("");
    onSubmit(form);
  };
  const message = validationError || error;

  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center sm:p-6"><form onSubmit={submit} className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#0d1016] p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6df4ff]">Dados de entrega</div><h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-white">Para onde vamos enviar?</h2><p className="mt-2 text-sm leading-6 text-white/45">Depois de escolher o produto, informe seus dados para prepararmos o envio e liberar o pagamento.</p></div>{onCancel && <button type="button" onClick={onCancel} className="icon-button" aria-label="Fechar cadastro"><X className="h-5 w-5" /></button>}</div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="form-label">Nome completo</span><input required value={form.fullName} onChange={(event) => update("fullName", event.target.value)} className="form-input" placeholder="Seu nome completo" autoComplete="name" /></label><label><span className="form-label">CPF</span><input required value={form.cpf} onChange={(event) => update("cpf", formatCpf(event.target.value))} className="form-input" placeholder="000.000.000-00" inputMode="numeric" autoComplete="off" /></label><label><span className="form-label">Data de nascimento</span><input required type="date" value={form.birthDate} onChange={(event) => update("birthDate", event.target.value)} className="form-input" autoComplete="bday" /></label><label className="sm:col-span-2"><span className="form-label">Endereço completo para entrega</span><input required value={form.address} onChange={(event) => update("address", event.target.value)} className="form-input" placeholder="Rua, número, bairro, cidade e estado" autoComplete="street-address" /></label><label><span className="form-label">Telefone</span><input required value={form.phone} onChange={(event) => update("phone", formatPhone(event.target.value))} className="form-input" placeholder="(00) 90000-0000" inputMode="tel" autoComplete="tel" /></label><label><span className="form-label">E-mail</span><input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} className="form-input" placeholder="voce@email.com" autoComplete="email" /></label></div>{message && <div className="mt-4 rounded-xl border border-[#ef6b77]/25 bg-[#ef6b77]/10 px-3 py-2 text-xs font-bold text-[#ffadb5]">{message}</div>}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} className="h-12 rounded-xl border border-white/10 px-5 text-xs font-black uppercase tracking-[0.1em] text-white/65 transition hover:border-white/25 hover:text-white">Voltar</button><button type="submit" disabled={isPending} className="h-12 rounded-xl bg-[#6df4ff] px-6 text-xs font-black uppercase tracking-[0.1em] text-[#071017] transition hover:bg-[#9cf8ff] disabled:cursor-wait disabled:opacity-60">{isPending ? "Preparando pagamento..." : "Continuar para pagamento"}</button></div><p className="mt-4 text-center text-[10px] leading-4 text-white/30">Seus dados são enviados de forma segura para processamento do pedido e atendimento da Gamers RTF.</p></form></div>;
}
