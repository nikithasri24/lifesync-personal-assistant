import React from 'react';

type DialogProps = {
  open: boolean;
  onOpenChange(open: boolean): void;
  title?: string;
  children: React.ReactNode;
};

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-4 shadow-xl">
        {title && <div className="mb-2 text-lg font-semibold">{title}</div>}
        {children}
      </div>
    </div>
  );
};

export default Dialog;

