import React from 'react'
import LoadingSpinner from './LoadingSpinner'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  disabled?: boolean
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  children,
  onClick,
  type = 'button',
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:cursor-not-allowed'

  const variantStyles = {
    primary: 'bg-primary-black text-primary-white hover:bg-gray-900 disabled:bg-gray-400',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400',
    outline: 'border-2 border-primary-black text-primary-black bg-transparent hover:bg-gray-100 disabled:border-gray-400 disabled:text-gray-400',
    ghost: 'bg-transparent text-gray-900 hover:bg-gray-100 disabled:text-gray-400',
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-lg',
  }

  const spinnerSize = {
    sm: 'sm',
    md: 'sm',
    lg: 'md',
  } as const

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size={spinnerSize[size]} className="mr-2" />
          <span>로딩중...</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

export default Button
