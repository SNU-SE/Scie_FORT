import React from 'react'

interface InputProps {
  label?: string
  error?: string
  helperText?: string
  type?: 'text' | 'password' | 'email'
  placeholder?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  className?: string
  name?: string
  id?: string
  autoComplete?: string
  autoFocus?: boolean
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
  name,
  id,
  autoComplete,
  autoFocus,
}) => {
  const inputId = id || name || label?.replace(/\s/g, '-').toLowerCase()

  const baseInputStyles = 'w-full px-4 py-3 text-gray-900 bg-primary-white border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder:text-gray-400'

  const inputStateStyles = error
    ? 'border-error focus:ring-error focus:border-error'
    : 'border-gray-200 focus:ring-gray-900 focus:border-gray-900 hover:border-gray-400'

  const disabledStyles = disabled
    ? 'bg-gray-100 cursor-not-allowed text-gray-400'
    : ''

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block mb-2 text-sm font-medium text-gray-900"
        >
          {label}
          {required && <span className="ml-1 text-error">*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className={`${baseInputStyles} ${inputStateStyles} ${disabledStyles}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-2 text-sm text-error">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-2 text-sm text-gray-600">
          {helperText}
        </p>
      )}
    </div>
  )
}

export default Input
