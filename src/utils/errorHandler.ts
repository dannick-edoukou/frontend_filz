export interface ErrorContext {
  action?: string;
  resource?: string;
  details?: string;
}

export function getErrorMessage(error: unknown, context?: ErrorContext): string {
  const defaultMessage = "Une erreur s'est produite. Veuillez réessayer.";
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes("network") || message.includes("fetch")) {
      return context?.action 
        ? `Impossible de ${context.action}. Vérifiez votre connexion internet.`
        : "Erreur de connexion. Vérifiez votre internet et réessayez.";
    }
    
    // Authentication errors
    if (message.includes("unauthorized") || message.includes("401")) {
      return "Votre session a expiré. Veuillez vous reconnecter.";
    }
    
    // Permission errors
    if (message.includes("forbidden") || message.includes("403")) {
      return context?.resource
        ? `Vous n'avez pas la permission d'accéder à ${context.resource}.`
        : "Vous n'avez pas la permission d'effectuer cette action.";
    }
    
    // Not found errors
    if (message.includes("not found") || message.includes("404")) {
      return context?.resource
        ? `${context.resource} introuvable.`
        : "Ressource introuvable.";
    }
    
    // Validation errors
    if (message.includes("validation") || message.includes("400")) {
      return context?.details || "Les données fournies sont invalides.";
    }
    
    // Rate limiting
    if (message.includes("rate limit") || message.includes("429")) {
      return "Trop de requêtes. Veuillez attendre quelques instants.";
    }
    
    // Server errors
    if (message.includes("server") || message.includes("500")) {
      return "Erreur serveur. Nos équipes sont informées. Veuillez réessayer plus tard.";
    }
    
    // Payment errors
    if (message.includes("payment") || message.includes("402")) {
      return "Erreur de paiement. Veuillez vérifier vos informations de paiement.";
    }
    
    return error.message || defaultMessage;
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  return defaultMessage;
}

export function getSuccessMessage(action: string, resource?: string): string {
  if (resource) {
    return `${resource} ${action} avec succès.`;
  }
  return `${action} réussi.`;
}
