/**
 * Form Validation Components
 * 
 * Provides reusable form components with built-in validation,
 * error display, and accessibility features.
 */

import React from 'react'
import { AlertCircle, CheckCircle, Eye, EyeOff, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

// Base form field wrapper
export const FormField = ({ 
  children, 
  label, 
  required = false, 
  error, 
  touched, 
  className,
  description,
  ...props 
}) => (
  <div className={cn('space-y-2', className)} {...props}>
    {label && (
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
    )}
    {description && (
      <p className="text-sm text-gray-500">{description}</p>
    )}
    <div className="relative">
      {children}
    </div>
    {error && touched && (
      <div className="flex items-center gap-2 text-sm text-red-600" role="alert">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    )}
    {!error && touched && (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
        <span>Looks good!</span>
      </div>
    )}
  </div>
)

// Validated text input
export const ValidatedInput = ({ 
  label, 
  error, 
  touched, 
  required = false,
  description,
  className,
  inputClassName,
  ...props 
}) => (
  <FormField 
    label={label} 
    error={error} 
    touched={touched} 
    required={required}
    description={description}
    className={className}
  >
    <Input
      className={cn(
        'transition-colors',
        error && touched && 'border-red-300 focus:border-red-500 focus:ring-red-500',
        !error && touched && 'border-green-300 focus:border-green-500 focus:ring-green-500',
        inputClassName
      )}
      {...props}
    />
  </FormField>
)

// Password input with visibility toggle
export const PasswordInput = ({ 
  label = 'Password',
  showStrength = false,
  error, 
  touched, 
  required = false,
  description,
  className,
  value,
  ...props 
}) => {
  const [showPassword, setShowPassword] = React.useState(false)
  
  // Password strength calculation
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, text: '', color: '' }
    
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++
    
    const strength = {
      0: { text: 'Very Weak', color: 'bg-red-500' },
      1: { text: 'Weak', color: 'bg-red-400' },
      2: { text: 'Fair', color: 'bg-yellow-500' },
      3: { text: 'Good', color: 'bg-blue-500' },
      4: { text: 'Strong', color: 'bg-green-500' },
      5: { text: 'Very Strong', color: 'bg-green-600' }
    }
    
    return { score, ...strength[score] }
  }
  
  const strength = showStrength ? getPasswordStrength(value) : null
  
  return (
    <FormField 
      label={label} 
      error={error} 
      touched={touched} 
      required={required}
      description={description}
      className={className}
    >
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          className={cn(
            'pr-10 transition-colors',
            error && touched && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            !error && touched && 'border-green-300 focus:border-green-500 focus:ring-green-500'
          )}
          value={value}
          {...props}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          ) : (
            <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      </div>
      
      {showStrength && value && (
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Password strength:</span>
            <span className={cn(
              'font-medium',
              strength.score <= 2 ? 'text-red-600' : 
              strength.score <= 3 ? 'text-yellow-600' : 'text-green-600'
            )}>
              {strength.text}
            </span>
          </div>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={cn(
                  'h-1 flex-1 rounded-full',
                  level <= strength.score ? strength.color : 'bg-gray-200'
                )}
              />
            ))}
          </div>
        </div>
      )}
    </FormField>
  )
}

// File upload component
export const FileUploadInput = ({
  label,
  error,
  touched,
  required = false,
  description,
  accept,
  multiple = false,
  maxSize,
  className,
  value = [],
  onChange,
  onRemove,
  ...props
}) => {
  const fileInputRef = React.useRef(null)
  
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || [])
    onChange && onChange(files)
  }
  
  const handleRemoveFile = (index) => {
    const newFiles = Array.from(value)
    newFiles.splice(index, 1)
    onChange && onChange(newFiles)
    onRemove && onRemove(index)
  }
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  return (
    <FormField 
      label={label} 
      error={error} 
      touched={touched} 
      required={required}
      description={description}
      className={className}
    >
      <div className="space-y-3">
        {/* Upload area */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            'hover:border-blue-400 hover:bg-blue-50',
            error && touched && 'border-red-300 bg-red-50',
            !error && touched && value.length > 0 && 'border-green-300 bg-green-50'
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
            {...props}
          />
          
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {accept && `Accepted types: ${accept}`}
            {maxSize && ` • Max size: ${formatFileSize(maxSize)}`}
          </p>
        </div>
        
        {/* File list */}
        {value.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Selected files:</p>
            {Array.from(value).map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  className="ml-2 p-1 hover:bg-gray-200 rounded"
                  onClick={() => handleRemoveFile(index)}
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </FormField>
  )
}

// Select dropdown with validation
export const ValidatedSelect = ({
  label,
  error,
  touched,
  required = false,
  description,
  options = [],
  placeholder = 'Select an option...',
  className,
  ...props
}) => (
  <FormField 
    label={label} 
    error={error} 
    touched={touched} 
    required={required}
    description={description}
    className={className}
  >
    <select
      className={cn(
        'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors',
        error && touched && 'border-red-300 focus:border-red-500 focus:ring-red-500',
        !error && touched && 'border-green-300 focus:border-green-500 focus:ring-green-500'
      )}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </FormField>
)

// Checkbox with validation
export const ValidatedCheckbox = ({
  label,
  error,
  touched,
  required = false,
  description,
  className,
  children,
  ...props
}) => (
  <FormField 
    error={error} 
    touched={touched} 
    required={required}
    description={description}
    className={className}
  >
    <div className="flex items-start space-x-3">
      <input
        type="checkbox"
        className={cn(
          'mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded',
          error && touched && 'border-red-300 focus:ring-red-500'
        )}
        {...props}
      />
      <div className="flex-1">
        {label && (
          <Label className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        {children}
      </div>
    </div>
  </FormField>
)

// Form validation summary
export const ValidationSummary = ({ errors, touched, className }) => {
  const visibleErrors = Object.keys(errors).filter(key => touched[key] && errors[key])
  
  if (visibleErrors.length === 0) return null
  
  return (
    <div className={cn('bg-red-50 border border-red-200 rounded-md p-4', className)}>
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Please fix the following errors:
          </h3>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
            {visibleErrors.map(key => (
              <li key={key}>{errors[key]}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// Submit button with validation state
export const ValidatedSubmitButton = ({
  children,
  isSubmitting = false,
  isValid = true,
  isDirty = false,
  requireDirty = false,
  loadingText = 'Submitting...',
  className,
  ...props
}) => {
  const isDisabled = isSubmitting || !isValid || (requireDirty && !isDirty)
  
  return (
    <Button
      type="submit"
      disabled={isDisabled}
      className={cn(
        'w-full transition-all duration-200',
        isDisabled && 'cursor-not-allowed opacity-50',
        className
      )}
      {...props}
    >
      {isSubmitting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}