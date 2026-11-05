import React from 'react';
import { AlertCircle } from 'lucide-react';

/** The red message under a highlighted field. Renders nothing when there is no error. */
export const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs leading-snug text-rose-300 animate-in fade-in slide-in-from-top-1 duration-200">
      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  ) : null;
