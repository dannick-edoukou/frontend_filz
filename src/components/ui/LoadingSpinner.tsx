import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading01Icon } from "@hugeicons/core-free-icons";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-label="Chargement">
      <HugeiconsIcon 
        icon={Loading01Icon} 
        size={size === "sm" ? 16 : size === "md" ? 24 : 32} 
        strokeWidth={2}
        className={`animate-spin text-gold-500 ${sizes[size]}`}
      />
    </div>
  );
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function LoadingButton({ 
  isLoading = false, 
  loadingText = "Chargement...", 
  children, 
  icon,
  disabled,
  type = "button",
  className = "",
  ...props 
}: LoadingButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`focus-ring inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {children}
          {icon}
        </>
      )}
    </button>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
}

export function LoadingOverlay({ isLoading, text = "Chargement..." }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div 
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-white/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-busy="true"
      aria-label="Chargement en cours"
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-xl">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-[#667085]">{text}</p>
      </div>
    </div>
  );
}
