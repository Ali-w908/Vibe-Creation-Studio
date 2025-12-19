import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// Toast Types
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (type: ToastType, message: string, duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Hook to use toast
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Toast Provider Component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, message: string, duration = 4000) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: Toast = { id, type, message, duration };

        setToasts(prev => [...prev, newToast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
};

// Toast Container
const ToastContainer: React.FC<{
    toasts: Toast[];
    onRemove: (id: string) => void;
}> = ({ toasts, onRemove }) => {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast, index) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onRemove={onRemove}
                    index={index}
                />
            ))}
        </div>
    );
};

// Individual Toast Item
const ToastItem: React.FC<{
    toast: Toast;
    onRemove: (id: string) => void;
    index: number;
}> = ({ toast, onRemove, index }) => {
    const [isExiting, setIsExiting] = React.useState(false);

    const handleRemove = () => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
    };

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
        error: <AlertCircle className="w-5 h-5 text-red-400" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
        info: <Info className="w-5 h-5 text-blue-400" />
    };

    const bgColors = {
        success: 'border-emerald-500/20 bg-emerald-500/10',
        error: 'border-red-500/20 bg-red-500/10',
        warning: 'border-amber-500/20 bg-amber-500/10',
        info: 'border-blue-500/20 bg-blue-500/10'
    };

    return (
        <div
            className={`
        pointer-events-auto
        flex items-center gap-3 
        px-4 py-3 
        min-w-[300px] max-w-[400px]
        bg-[#0f0f18]/95 backdrop-blur-xl
        border ${bgColors[toast.type]}
        rounded-xl shadow-2xl
        ${isExiting ? 'toast-exit' : 'toast-enter'}
      `}
            style={{ animationDelay: `${index * 0.05}s` }}
        >
            {icons[toast.type]}
            <p className="flex-1 text-sm text-gray-200">{toast.message}</p>
            <button
                onClick={handleRemove}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
                <X className="w-4 h-4 text-gray-500" />
            </button>

            {/* Progress bar for auto-dismiss */}
            {toast.duration && toast.duration > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 rounded-b-xl overflow-hidden">
                    <div
                        className="h-full bg-white/30"
                        style={{
                            animation: `shrink ${toast.duration}ms linear forwards`
                        }}
                    />
                </div>
            )}
        </div>
    );
};

// Add shrink animation to global styles
const styleTag = document.createElement('style');
styleTag.textContent = `
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
`;
if (typeof document !== 'undefined' && !document.querySelector('[data-toast-styles]')) {
    styleTag.setAttribute('data-toast-styles', 'true');
    document.head.appendChild(styleTag);
}

export default ToastProvider;
