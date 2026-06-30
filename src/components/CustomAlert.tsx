import React from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CustomAlertProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "success" | "error" | "info" | "warning";
  onClose: () => void;
}

export default function CustomAlert({ isOpen, title, message, type = "info", onClose }: CustomAlertProps) {
  if (!isOpen) return null;

  // Set colors and icon based on type
  let icon = <Info className="w-6 h-6 text-brand-sky-dark" />;
  let headerBg = "bg-brand-sky";
  let textColor = "text-brand-sky-dark";
  let borderBorder = "border-brand-sky-dark/20";

  if (type === "success") {
    icon = <CheckCircle2 className="w-6 h-6 text-brand-sage-dark" />;
    headerBg = "bg-brand-sage";
    textColor = "text-brand-sage-dark";
    borderBorder = "border-brand-sage-dark/20";
  } else if (type === "error") {
    icon = <XCircle className="w-6 h-6 text-brand-blush-dark" />;
    headerBg = "bg-brand-blush";
    textColor = "text-brand-blush-dark";
    borderBorder = "border-brand-blush-dark/20";
  } else if (type === "warning") {
    icon = <AlertTriangle className="w-6 h-6 text-amber-600" />;
    headerBg = "bg-amber-50";
    textColor = "text-amber-800";
    borderBorder = "border-amber-200";
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#2D2825]/40 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
          className="relative bg-brand-white border border-brand-sand/80 max-w-md w-full rounded-3xl shadow-2xl overflow-hidden font-sans z-10"
        >
          {/* Accent Header Line */}
          <div className={`h-2 ${headerBg}`} />

          {/* Core Layout */}
          <div className="p-6 md:p-8 space-y-5 text-center flex flex-col items-center">
            {/* Round Icon container */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${headerBg}`}>
              {icon}
            </div>

            {/* Title & Message */}
            <div className="space-y-2">
              <h4 className="font-serif text-xl font-extrabold text-brand-text leading-tight">
                {title}
              </h4>
              <p className="text-xs text-brand-text-soft leading-relaxed max-w-sm">
                {message}
              </p>
            </div>

            {/* Action button */}
            <button
              onClick={onClose}
              id="custom-alert-confirm-btn"
              className="w-full py-3 px-6 text-xs font-bold text-brand-white bg-brand-text hover:bg-brand-blush-dark rounded-xl shadow-md active:scale-98 transition-all cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
