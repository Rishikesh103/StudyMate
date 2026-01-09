import { useToastListener } from "@/hooks/use-toast";

export function Toaster() {
    const toasts = useToastListener();

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <div key={toast.id} className={`toast toast-${toast.variant}`}>
                    <div className="toast-title">{toast.title}</div>
                    {toast.description && <div className="toast-description">{toast.description}</div>}
                </div>
            ))}
        </div>
    );
}
