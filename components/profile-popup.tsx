import { useRef, useEffect } from 'react';

interface ProfilePopupProps {
  username: string;
  registrationDate: string;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function ProfilePopup({ username, registrationDate, isOpen, onClose, onLogout }: ProfilePopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Закрытие при клике вне попапа
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formattedDate = new Date(registrationDate).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div 
      ref={popupRef}
      className="absolute top-12 right-0 border-2 border-black bg-white p-4 w-64 shadow-md"
      style={{ fontFamily: "var(--font-rationalist-light)" }}
    >
      <div className="mb-3">
        <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-rationalist-bold)" }}>
          {username}
        </h3>
      </div>
      
      <div className="mb-4 text-sm">
        <p className="text-gray-700">
          Дата регистрации: {formattedDate}
        </p>
      </div>
      
      <div className="flex justify-end">
        <button 
          onClick={onLogout}
          className="px-3 py-1 bg-black text-white text-sm"
        >
          Выйти
        </button>
      </div>
    </div>
  );
} 