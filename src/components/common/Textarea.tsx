import React from 'react'

interface TextareaProps {
  label?: string
  error?: string
  helperText?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  className?: string
  name?: string
  id?: string
  rows?: number
  maxLength?: number
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
  name,
  id,
  rows = 4,
  maxLength,
}) => {
  const textareaId = id || name || label?.replace(/\s/g, '-').toLowerCase()

  const baseTextareaStyles = 'w-full px-4 py-3 text-gray-900 bg-primary-white border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder:text-gray-400 resize-none'

  const textareaStateStyles = error
    ? 'border-error focus:ring-error focus:border-error'
    : 'border-gray-200 focus:ring-gray-900 focus:border-gray-900 hover:border-gray-400'

  const disabledStyles = disabled
    ? 'bg-gray-100 cursor-not-allowed text-gray-400'
    : ''

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block mb-2 text-sm font-medium text-gray-900"
        >
          {label}
          {required && <span className="ml-1 text-error">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        className={`${baseTextareaStyles} ${textareaStateStyles} ${disabledStyles}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
      />
      <div className="flex justify-between mt-2">
        <div>
          {error && (
            <p id={`${textareaId}-error`} className="text-sm text-error">
              {error}
            </p>
          )}
          {helperText && !error && (
            <p id={`${textareaId}-helper`} className="text-sm text-gray-600">
              {helperText}
            </p>
          )}
        </div>
        {maxLength && (
          <p className="text-sm text-gray-400">
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}

export default Textarea
