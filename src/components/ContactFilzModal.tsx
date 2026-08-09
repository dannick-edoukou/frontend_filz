import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon } from "@hugeicons/core-free-icons";
import { Modal } from "./ui/Modal";
import { LoadingButton } from "./ui/LoadingSpinner";
import { api } from "../utils/api";
import { useToast } from "./ui/Toast";
import { getErrorMessage } from "../utils/errorHandler";

interface ContactFilzModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactFilzModal({ isOpen, onClose }: ContactFilzModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("technical_support");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await api.post("/public/contact", { name, email, category, subject, message });
      showSuccess("Message envoyé", "Notre équipe vous répondra rapidement.");
      setName("");
      setEmail("");
      setCategory("technical_support");
      setSubject("");
      setMessage("");
      onClose();
    } catch (err: any) {
      showError(getErrorMessage(err, { action: "envoi du message" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contacter Filz">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-ink">
            Nom
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
              className="input mt-2"
            />
          </label>
          <label className="block text-sm font-semibold text-ink">
            E-mail
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@entreprise.ci"
              className="input mt-2"
            />
          </label>
        </div>
        <label className="block text-sm font-semibold text-ink">
          Sujet de la demande
          <input
            required
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ex : Problème d'accès à mon espace"
            className="input mt-2"
          />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Catégorie
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input mt-2 bg-white">
            <option value="technical_support">Support technique</option>
            <option value="customization">Personnalisation</option>
            <option value="bug">Bug</option>
            <option value="billing">Facturation</option>
            <option value="partnership">Partenariat</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-ink">
          Message
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Expliquez votre demande en détail..."
            className="input mt-2 min-h-[120px] py-2"
          />
        </label>
        <LoadingButton
          isLoading={loading}
          loadingText="Envoi en cours…"
          type="submit"
          className="w-full bg-pine-900 text-white hover:bg-pine-700 shadow-primary"
          icon={!loading && <HugeiconsIcon icon={SentIcon} size={17} />}
        >
          Envoyer
        </LoadingButton>
      </form>
    </Modal>
  );
}
