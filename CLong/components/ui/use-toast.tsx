'use client';

import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { X } from 'lucide-react';

// Toast 组件的属性定义
export type ToastProps = {
  id?: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
};

type ToastContextType = {
  toasts: ToastProps[];
  addToast: (toast: ToastProps) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((toast: ToastProps) => {
    const id = toast.id || Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    
    setToasts((prevToasts) => [...prevToasts, newToast]);

    if (toast.duration !== Infinity) {
      setTimeout(() => {
        setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
      }, toast.duration || 3000);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`bg-white shadow-lg rounded-lg p-4 min-w-[300px] max-w-md border-l-4 ${
              toast.variant === 'success'
                ? 'border-green-500'
                : toast.variant === 'error'
                ? 'border-red-500'
                : toast.variant === 'warning'
                ? 'border-yellow-500'
                : 'border-blue-500'
            } animate-in slide-in-from-right-full`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{toast.title}</h3>
                {toast.description && <p className="text-sm text-gray-500 mt-1">{toast.description}</p>}
              </div>
              <button
                onClick={() => removeToast(toast.id!)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// 提供简便方法用于创建toast
export const toast = (() => {
  // 客户端渲染时使用DOM API
  if (typeof window !== 'undefined') {
    return {
      create: (props: ToastProps) => {
        const event = new CustomEvent('create-toast', { detail: props });
        document.dispatchEvent(event);
      },
    };
  }
  
  // 服务端渲染时不执行任何操作
  return {
    create: () => {},
  };
})();

// 用于创建toast元素的辅助函数
function createToastElement(toast: ToastProps) {
  const toastElement = document.createElement('div');
  toastElement.className = `bg-white shadow-lg rounded-lg p-4 min-w-[300px] max-w-md border-l-4 ${
    toast.variant === 'success'
      ? 'border-green-500'
      : toast.variant === 'error'
      ? 'border-red-500'
      : toast.variant === 'warning'
      ? 'border-yellow-500'
      : 'border-blue-500'
  } animate-in slide-in-from-right-full`;
  
  toastElement.innerHTML = `
    <div class="flex justify-between items-start">
      <div>
        <h3 class="font-medium">${toast.title}</h3>
        ${toast.description ? `<p class="text-sm text-gray-500 mt-1">${toast.description}</p>` : ''}
      </div>
      <button class="text-gray-400 hover:text-gray-600">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `;
  
  return toastElement;
} 