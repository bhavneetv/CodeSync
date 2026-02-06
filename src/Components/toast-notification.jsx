import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// Toast Context
const ToastContext = createContext();

// Toast Provider Component
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        const newToast = { id, message, type, duration };

        setToasts((prev) => [...prev, newToast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    useEffect(() => {
        setToastFunction(addToast);
        return () => setToastFunction(null);
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

// Hook to use toast
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none max-w-full">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                ))}
            </AnimatePresence>
        </div>
    );
};

// Individual Toast Component
const Toast = ({ toast, onClose }) => {
    const { message, type } = toast;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <Check className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />;
            case 'info':
            default:
                return <Info className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />;
        }
    };

    const getColors = () => {
        switch (type) {
            case 'success':
                return {
                    bg: 'from-green-500/20 to-emerald-500/20',
                    border: 'border-green-500/30',
                    icon: 'text-green-400',
                    shadow: 'shadow-green-500/20',
                };
            case 'error':
                return {
                    bg: 'from-red-500/20 to-rose-500/20',
                    border: 'border-red-500/30',
                    icon: 'text-red-400',
                    shadow: 'shadow-red-500/20',
                };
            case 'warning':
                return {
                    bg: 'from-yellow-500/20 to-orange-500/20',
                    border: 'border-yellow-500/30',
                    icon: 'text-yellow-400',
                    shadow: 'shadow-yellow-500/20',
                };
            case 'info':
            default:
                return {
                    bg: 'from-blue-500/20 to-cyan-500/20',
                    border: 'border-blue-500/30',
                    icon: 'text-blue-400',
                    shadow: 'shadow-blue-500/20',
                };
        }
    };

    const colors = getColors();

    return (
        <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                opacity: { duration: 0.2 }
            }}
            className="pointer-events-auto"
        >
            <div
                className={`
          backdrop-blur-xl bg-gradient-to-r ${colors.bg}
          border ${colors.border}
          rounded-xl shadow-lg ${colors.shadow}
          flex items-center gap-2 sm:gap-3
          px-3 py-2.5 sm:px-4 sm:py-3
          max-w-[calc(100vw-2rem)] sm:max-w-md
          transition-all duration-300
        `}
            >
                {/* Icon */}
                <div className={`${colors.icon} flex-shrink-0`}>
                    {getIcon()}
                </div>

                {/* Message */}
                <p className="text-white text-sm sm:text-base font-medium flex-1 min-w-0">
                    <span className="hidden sm:inline">{message}</span>
                    <span className="sm:hidden truncate block">{message.slice(0, 30)}{message.length > 30 ? '...' : ''}</span>
                </p>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className={`
            ${colors.icon} hover:bg-white/10
            rounded-lg p-1 sm:p-1.5
            transition-colors duration-200
            flex-shrink-0
          `}
                    aria-label="Close notification"
                >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
            </div>
        </motion.div>
    );
};

// Standalone function to show toast (for convenience)
let toastFunction = null;

export const setToastFunction = (fn) => {
    toastFunction = fn;
};

export const showToast = (message, type = 'info', duration = 4000) => {
    if (toastFunction) {
        toastFunction(message, type, duration);
    } else {
        console.warn('Toast provider not initialized');
    }
};
