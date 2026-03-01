import React from 'react';
import { Camera, Mic, Edit } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';

interface AddItemChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBarcode: () => void;
  onSelectVoice: () => void;
  onSelectManual: () => void;
}

export function AddItemChoiceModal({
  isOpen,
  onClose,
  onSelectBarcode,
  onSelectVoice,
  onSelectManual,
}: AddItemChoiceModalProps) {
  const colors = useThemeColors();

  // Close on Escape key - MUST be before early return
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const options = [
    {
      icon: Camera,
      title: 'Scan Barcode',
      description: 'Quick scan with camera',
      onClick: onSelectBarcode,
    },
    {
      icon: Mic,
      title: 'Voice Input',
      description: 'Say what you need',
      onClick: onSelectVoice,
    },
    {
      icon: Edit,
      title: 'Manual Entry',
      description: 'Type item details',
      onClick: onSelectManual,
    },
  ];

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 z-50 flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        height: 'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl p-6 animate-slide-up"
        style={{
          maxHeight: '500px',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Drag Handle */}
        <div
          className="w-9 h-1 rounded-full mx-auto mb-5"
          style={{ backgroundColor: colors.border.medium }}
        />

        {/* Title */}
        <h2
          className="text-2xl font-bold text-center mb-5"
          style={{ color: colors.text.primary }}
        >
          Add Item
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.title}
                type="button"
                onClick={() => {
                  option.onClick();
                  onClose();
                }}
                className="w-full flex items-center gap-4 p-5 rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: colors.bg.primary,
                  border: `2px solid ${colors.border.light}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, rgba(212, 165, 116, 0.1) 0%, rgba(193, 139, 94, 0.1) 100%)`;
                  e.currentTarget.style.borderColor = colors.accent.start;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg.primary;
                  e.currentTarget.style.borderColor = colors.border.light;
                }}
                aria-label={option.title}
              >
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                  }}
                >
                  <Icon size={24} color="white" />
                </div>

                {/* Text */}
                <div className="flex-1 text-left">
                  <h3
                    className="text-lg font-semibold mb-1"
                    style={{ color: colors.text.primary }}
                  >
                    {option.title}
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: colors.text.tertiary }}
                  >
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
