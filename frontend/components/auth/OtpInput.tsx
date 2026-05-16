'use client';

import { useRef, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error,
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val && !digits[index]) return;

    const newDigits = [...digits];
    // Handle paste of multiple digits into a single box
    if (val.length > 1) {
      const chars = val.slice(0, length - index).split('');
      chars.forEach((char, i) => {
        if (index + i < length) newDigits[index + i] = char;
      });
      const nextIndex = Math.min(index + chars.length, length - 1);
      inputsRef.current[nextIndex]?.focus();
    } else {
      newDigits[index] = val.slice(-1);
      if (val && index < length - 1) {
        inputsRef.current[index + 1]?.focus();
      }
    }

    onChange(newDigits.join(''));
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputsRef.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pastedData) return;

    const newDigits = [...digits];
    pastedData.split('').forEach((char, i) => {
      if (i < length) newDigits[i] = char;
    });
    onChange(newDigits.join(''));

    const nextFocus = Math.min(pastedData.length, length - 1);
    inputsRef.current[nextFocus]?.focus();
  };

  return (
    <div>
      <div className="flex items-center gap-2 justify-center">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputsRef.current[index] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            disabled={disabled}
            className={cn(
              'otp-input',
              error && 'border-red-400 focus:border-red-400 focus:ring-red-400/20',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
