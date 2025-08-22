import { useRef, useEffect } from 'react';
import { LogOut } from 'lucide-react';

interface ProfilePopupProps {
  username: string;
  email: string;
  experience: number;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function ProfilePopup({ username, email, experience, isOpen, onClose, onLogout }: ProfilePopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Закрытие при клике вне
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

  return (
    <div 
      ref={popupRef}
      className="absolute top-12 left-1/2 -translate-x-1/2 border-[1px] border-black bg-white p-4 w-64 shadow-md z-50"
      style={{ fontFamily: "var(--font-rationalist-light)" }}
    >
      <div className="mb-3">
        <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-rationalist-bold)" }}>
          {username}
        </h3>
      </div>
      
      <hr className="border-t-[1px] border-black -mx-4 mb-4" />
      
      <div className="mb-4 text-sm">
        <p className="text-gray-700 mb-2">
          Email: {email}
        </p>
        <p className="text-gray-700">
          Опыт: {experience} XP
        </p>
      </div>
      
      <hr className="border-t-[1px] border-black -mx-4 mb-4" />
      
      <div className="flex justify-end items-center">
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLogout();
          }}
          className="text-sm text-gray-700 hover:text-black flex items-center gap-2 transition-colors cursor-pointer group"
          style={{ fontFamily: "var(--font-rationalist-demibold)" }}
        >
          <LogOut className="group-hover:text-black transition-colors" size={16} />
          <span>Выйти</span>
        </button>
      </div>
    </div>
  );
} 