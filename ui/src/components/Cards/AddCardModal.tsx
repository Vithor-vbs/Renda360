import React, { useState, useEffect } from "react"
import { X } from "lucide-react"

interface AddCardModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (card: any) => void
}

export const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onSave }) => {
    const [cardData, setCardData] = useState({
        name: "",
        number: "",
        holder: "",
        expiry: "",
        cvv: "",
    })
    const [flipped, setFlipped] = useState(false)

    useEffect(() => {
        if (!isOpen) {
            setCardData({ name: "", number: "", holder: "", expiry: "", cvv: "" })
            setFlipped(false)
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(cardData)
        onClose()
    }

    const formatCardNumber = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 16);
        return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    };

    const onlyDigits = (s: string) => s.replace(/\D/g, "");

    const formatExpiry = (value: string) => {
        const d = onlyDigits(value).slice(0, 4);
        if (d.length === 0) return "";

        if (d.length === 1) {
            const n = +d;
            return n > 1 ? `0${n}` : d;
        }

        let mm = d.slice(0, 2);
        const yy = d.slice(2, 4);

        let m = parseInt(mm, 10);
        if (isNaN(m) || m <= 0) m = 1;
        if (m > 12) m = 12;
        mm = m.toString().padStart(2, "0");

        return yy ? `${mm}/${yy}` : mm;
    };

    const allowOnlyNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const ok = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"];
        if (ok.includes(e.key)) return;
        if (!/^[0-9]$/.test(e.key)) e.preventDefault();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-[#2a2a2a] px-6 py-4">
                    <h2 className="text-xl font-semibold text-white">Adicionar Novo Cartão</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <X size={22} />
                    </button>
                </div>

                {/* BODY */}
                <div className="grid md:grid-cols-2 gap-8 p-6">
                    {/* PREVIEW */}
                    <div className="flex justify-center items-center">
                        <div
                            className={`relative w-[320px] h-[200px] transition-transform duration-700`}
                            style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
                        >
                            {/* FRONT */}
                            <div
                                className="absolute inset-0 rounded-xl text-white p-5"
                                style={{
                                    background: "linear-gradient(135deg, #10b981, #0ea5e9)",
                                    backfaceVisibility: "hidden",
                                    boxShadow: "0 10px 25px rgba(0,0,0,.3)",
                                }}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="text-sm opacity-90">{cardData.name || "Nome do Cartão"}</span>
                                    <div className="w-8 h-8 rounded-full bg-white/30" />
                                </div>
                                <div className="mt-6 text-xl font-mono tracking-widest">
                                    {cardData.number || "0000 0000 0000 0000"}
                                </div>
                                <div className="absolute bottom-5 left-5 right-5 flex justify-between text-sm uppercase">
                                    <div>
                                        <span className="text-gray-200">Nome do Titular</span>
                                        <div>{cardData.holder || "SEU NOME"}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-200">Validade</span>
                                        <div>{cardData.expiry || "MM/AA"}</div>
                                    </div>
                                </div>
                            </div>

                            {/* BACK */}
                            <div
                                className="absolute inset-0 rounded-xl text-white p-5"
                                style={{
                                    background: "linear-gradient(135deg, #0ea5e9, #0ad1b2)",
                                    transform: "rotateY(180deg)",
                                    backfaceVisibility: "hidden",
                                    boxShadow: "0 10px 25px rgba(0,0,0,.3)",
                                }}
                            >
                                <div className="h-10 bg-black/70 mt-4 mb-6 rounded-sm" />
                                <div className="bg-white/90 text-black rounded px-3 py-2">
                                    <div className="flex justify-between">
                                        <span className="text-xs">CVV</span>
                                        <strong>{cardData.cvv || "***"}</strong>
                                    </div>
                                </div>
                                <p className="text-[11px] mt-3 text-gray-300">
                                    Este código ajuda a proteger suas transações
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* FORM */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <label className="flex flex-col text-sm text-gray-300">
                            Nome do Cartão
                            <input
                                type="text"
                                placeholder="Ex: Cartão Principal"
                                value={cardData.name}
                                onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                                className="mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </label>

                        <label className="flex flex-col text-sm text-gray-300">
                            Número do Cartão
                            <input
                                type="text"
                                placeholder="0000 0000 0000 0000"
                                value={cardData.number}
                                onChange={(e) =>
                                    setCardData({ ...cardData, number: formatCardNumber(e.target.value) })
                                }
                                className="mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                            />

                        </label>

                        <label className="flex flex-col text-sm text-gray-300">
                            Nome do Titular
                            <input
                                type="text"
                                placeholder="COMO ESTÁ NO CARTÃO"
                                maxLength={20}
                                value={cardData.holder}
                                onChange={(e) => setCardData({ ...cardData, holder: e.target.value.toUpperCase() })}
                                className="mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                            />
                        </label>

                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex flex-col text-sm text-gray-300">
                                Validade
                                <input
                                    type="text"
                                    placeholder="MM/AA"
                                    value={cardData.expiry}
                                    onFocus={() => setFlipped(false)}
                                    onChange={(e) => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                                    className="mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                />
                            </label>

                            <label className="flex flex-col text-sm text-gray-300">
                                CVV
                                <input
                                    type="text"
                                    placeholder="123"
                                    maxLength={3}
                                    value={cardData.cvv}
                                    onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                                    onFocus={() => setFlipped(true)}
                                    onBlur={() => setFlipped(false)}
                                    className="mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                />
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 mt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 hover:bg-[#222] transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
                            >
                                Adicionar Cartão
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
