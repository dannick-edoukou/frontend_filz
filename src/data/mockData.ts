import { FormField, QueueEntry, Service, SupportTicket } from "../types";

export const queueEntries: QueueEntry[] = [
{ id: "1", ticket: "A-104", name: "Aïcha K.", service: "Consultation générale", waitingMinutes: 12, state: "serving", joinedAt: "09:14" },
{ id: "2", ticket: "A-105", name: "Koffi A.", service: "Consultation générale", waitingMinutes: 18, state: "called", joinedAt: "09:21" },
{ id: "3", ticket: "A-106", name: "Marie D.", service: "Pédiatrie", waitingMinutes: 24, state: "waiting", joinedAt: "09:28" },
{ id: "4", ticket: "A-107", name: "Yao N.", service: "Consultation générale", waitingMinutes: 31, state: "waiting", joinedAt: "09:35" },
{ id: "5", ticket: "A-108", name: "Fatou B.", service: "Pédiatrie", waitingMinutes: 9, state: "absent", joinedAt: "09:41" }];


export const services: Service[] = [
{ id: "general", name: "Consultation générale", location: "Plateau · Accueil 1", averageWait: 18, activeCount: 14, status: "open" },
{ id: "pediatrie", name: "Pédiatrie", location: "Plateau · Accueil 2", averageWait: 24, activeCount: 7, status: "open" },
{ id: "laboratoire", name: "Laboratoire", location: "Cocody · Guichet 1", averageWait: 8, activeCount: 3, status: "paused" }];


export const clinicFields: FormField[] = [
{ id: "name", label: "Nom complet", type: "text", required: true },
{ id: "phone", label: "Numéro de téléphone", type: "phone", required: true },
{ id: "reason", label: "Motif de votre visite", type: "select", required: true, options: ["Consultation", "Contrôle", "Résultats d'examens"] },
{ id: "note", label: "Information complémentaire", type: "textarea", required: false }];


export const supportTickets: SupportTicket[] = [
{
  id: "SUP-1842",
  subject: "Ajout d'un second établissement",
  category: "Personnalisation",
  status: "in_progress",
  updatedAt: "Aujourd’hui, 10:12",
  messages: [
  { id: "m1", sender: "company", author: "Aminata Koné", body: "Bonjour, nous ouvrons un point de consultation à Cocody. Pouvez-vous nous aider à l'ajouter ?", time: "Hier, 16:24" },
  { id: "m2", sender: "support", author: "Équipe Fila", body: "Bonjour Aminata, bien sûr. Votre plan permet jusqu'à 3 établissements. Nous pouvons vous accompagner pour la mise en place.", time: "Aujourd’hui, 09:46" }]

},
{ id: "SUP-1798", subject: "Question sur la facturation", category: "Facturation", status: "resolved", updatedAt: "12 juin 2026", messages: [] }];


export const chartData = [42, 54, 48, 69, 63, 78, 73];