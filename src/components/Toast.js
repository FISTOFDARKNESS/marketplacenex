'use client';

import { useEffect } from 'react';
import { CheckCircle, Heart, Rocket, Info, AlertTriangle } from 'lucide-react';

const icons = {
  'check-circle': CheckCircle,
  'heart': Heart,
  'rocket': Rocket,
  'alert-triangle': AlertTriangle,
  'info': Info
};

export default function Toast({ id, icon, message, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [id, onRemove]);

  const IconComponent = icons[icon] || Info;

  return (
    <div className="toast">
      <IconComponent className="icon" />
      <span>{message}</span>
    </div>
  );
}
