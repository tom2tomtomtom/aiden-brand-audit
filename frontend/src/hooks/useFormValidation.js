/**
 * Comprehensive Form Validation Hook
 * 
 * Provides real-time form validation with custom rules,
 * error handling, and accessibility features.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'

// Built-in validation rules
const validationRules = {
  required: (value, message = 'This field is required') => {
    if (typeof value === 'string') {
      return value.trim().length > 0 ? null : message
    }
    return value != null && value !== '' ? null : message
  },
  
  minLength: (min, message) => (value) => {
    if (!value) return null // Skip if empty (use required rule for that)
    return value.length >= min ? null : message || `Must be at least ${min} characters`
  },
  
  maxLength: (max, message) => (value) => {
    if (!value) return null
    return value.length <= max ? null : message || `Must be no more than ${max} characters`
  },
  
  email: (value, message = 'Please enter a valid email address') => {
    if (!value) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) ? null : message
  },
  
  url: (value, message = 'Please enter a valid URL') => {
    if (!value) return null
    try {
      new URL(value)
      return null
    } catch {
      return message
    }
  },
  
  pattern: (regex, message) => (value) => {
    if (!value) return null
    return regex.test(value) ? null : message
  },
  
  numeric: (value, message = 'Please enter a valid number') => {
    if (!value) return null
    return !isNaN(value) && !isNaN(parseFloat(value)) ? null : message
  },
  
  integer: (value, message = 'Please enter a valid whole number') => {
    if (!value) return null
    return Number.isInteger(Number(value)) ? null : message
  },
  
  min: (min, message) => (value) => {
    if (!value) return null
    const num = Number(value)
    return num >= min ? null : message || `Must be at least ${min}`
  },
  
  max: (max, message) => (value) => (
    !value || Number(value) <= max ? null : message || `Must be no more than ${max}`
  ),
  
  brandName: (value, message = 'Please enter a valid brand name') => {
    if (!value) return null
    // Allow letters, numbers, spaces, hyphens, and common punctuation
    const brandRegex = /^[a-zA-Z0-9\s&.\-'_()]+$/
    if (!brandRegex.test(value)) {
      return 'Brand name contains invalid characters'
    }
    if (value.trim().length < 2) {
      return 'Brand name must be at least 2 characters'
    }
    if (value.trim().length > 100) {
      return 'Brand name must be less than 100 characters'
    }
    return null
  },
  
  password: (value, message = 'Password does not meet requirements') => {
    if (!value) return null
    const requirements = []
    
    if (value.length < 8) {
      requirements.push('at least 8 characters')
    }
    if (!/[A-Z]/.test(value)) {
      requirements.push('one uppercase letter')
    }
    if (!/[a-z]/.test(value)) {
      requirements.push('one lowercase letter')
    }
    if (!/\d/.test(value)) {
      requirements.push('one number')
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      requirements.push('one special character')
    }
    
    return requirements.length === 0 
      ? null 
      : `Password must contain ${requirements.join(', ')}`
  },
  
  confirmPassword: (originalField) => (value, formData) => {
    if (!value) return null
    return value === formData[originalField] ? null : 'Passwords do not match'
  },
  
  fileSize: (maxSizeInMB, message) => (files) => {
    if (!files || files.length === 0) return null
    
    const maxBytes = maxSizeInMB * 1024 * 1024
    for (let file of files) {
      if (file.size > maxBytes) {
        return message || `File size must be less than ${maxSizeInMB}MB`
      }
    }
    return null
  },
  
  fileType: (allowedTypes, message) => (files) => {
    if (!files || files.length === 0) return null
    
    for (let file of files) {
      if (!allowedTypes.includes(file.type)) {
        return message || `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      }
    }
    return null
  }
}

const useFormValidation = (initialValues = {}, validationSchema = {}) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  
  // Validate a single field
  const validateField = useCallback((fieldName, value, allValues = values) => {
    const fieldRules = validationSchema[fieldName]
    if (!fieldRules) return null
    
    // Convert single rule to array
    const rules = Array.isArray(fieldRules) ? fieldRules : [fieldRules]
    
    for (const rule of rules) {
      let error = null
      
      if (typeof rule === 'function') {
        // Custom validation function
        error = rule(value, allValues)
      } else if (typeof rule === 'object' && rule.rule) {
        // Rule object with parameters
        const { rule: ruleName, message, ...params } = rule
        const validationFn = validationRules[ruleName]
        
        if (validationFn) {
          if (Object.keys(params).length > 0) {
            // Rule with parameters (e.g., minLength: { rule: 'minLength', min: 5 })
            const paramValues = Object.values(params)
            error = validationFn(...paramValues, message)(value, allValues)
          } else {
            // Simple rule (e.g., required: { rule: 'required' })
            error = validationFn(value, message)
          }
        }
      } else if (typeof rule === 'string') {
        // Simple rule name
        const validationFn = validationRules[rule]
        if (validationFn) {
          error = validationFn(value)
        }
      }
      
      if (error) {
        return error
      }
    }
    
    return null
  }, [validationSchema, values])
  
  // Validate all fields
  const validateForm = useCallback((valuesToValidate = values) => {
    const newErrors = {}
    
    Object.keys(validationSchema).forEach(fieldName => {
      const error = validateField(fieldName, valuesToValidate[fieldName], valuesToValidate)
      if (error) {
        newErrors[fieldName] = error
      }
    })
    
    return newErrors
  }, [validationSchema, validateField, values])
  
  // Update field value
  const setFieldValue = useCallback((fieldName, value) => {
    setValues(prev => ({ ...prev, [fieldName]: value }))
    
    // Validate field if it has been touched or submit was attempted
    if (touched[fieldName] || submitAttempted) {
      const error = validateField(fieldName, value)
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }))
    }
  }, [touched, submitAttempted, validateField])
  
  // Mark field as touched
  const setFieldTouched = useCallback((fieldName, isTouched = true) => {
    setTouched(prev => ({ ...prev, [fieldName]: isTouched }))
    
    // Validate field when touched
    if (isTouched) {
      const error = validateField(fieldName, values[fieldName])
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }))
    }
  }, [validateField, values])
  
  // Handle input change
  const handleChange = useCallback((fieldName) => (event) => {
    const value = event.target.type === 'checkbox' 
      ? event.target.checked 
      : event.target.type === 'file'
        ? event.target.files
        : event.target.value
    
    setFieldValue(fieldName, value)
  }, [setFieldValue])
  
  // Handle input blur
  const handleBlur = useCallback((fieldName) => () => {
    setFieldTouched(fieldName, true)
  }, [setFieldTouched])
  
  // Handle form submission
  const handleSubmit = useCallback((onSubmit) => async (event) => {
    event.preventDefault()
    setSubmitAttempted(true)
    setIsSubmitting(true)
    
    const formErrors = validateForm()
    setErrors(formErrors)
    
    const hasErrors = Object.keys(formErrors).length > 0
    
    if (!hasErrors) {
      try {
        await onSubmit(values)
      } catch (error) {
        console.error('Form submission error:', error)
      }
    }
    
    setIsSubmitting(false)
  }, [validateForm, values])
  
  // Reset form
  const resetForm = useCallback((newValues = initialValues) => {
    setValues(newValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
    setSubmitAttempted(false)
  }, [initialValues])
  
  // Get field props (for easy spreading)
  const getFieldProps = useCallback((fieldName) => ({
    name: fieldName,
    value: values[fieldName] || '',
    onChange: handleChange(fieldName),
    onBlur: handleBlur(fieldName),
    'aria-invalid': errors[fieldName] ? 'true' : 'false',
    'aria-describedby': errors[fieldName] ? `${fieldName}-error` : undefined,
  }), [values, handleChange, handleBlur, errors])
  
  // Get field state
  const getFieldState = useCallback((fieldName) => ({
    value: values[fieldName],
    error: errors[fieldName],
    touched: touched[fieldName],
    hasError: Boolean(errors[fieldName]),
    isValid: !errors[fieldName] && touched[fieldName]
  }), [values, errors, touched])
  
  // Computed values
  const isValid = useMemo(() => {
    return Object.keys(validationSchema).every(fieldName => !errors[fieldName])
  }, [errors, validationSchema])
  
  const isDirty = useMemo(() => {
    return Object.keys(values).some(key => values[key] !== initialValues[key])
  }, [values, initialValues])
  
  const hasErrors = useMemo(() => {
    return Object.keys(errors).length > 0
  }, [errors])
  
  // Auto-validate on values change (after submit attempted)
  useEffect(() => {
    if (submitAttempted) {
      const formErrors = validateForm()
      setErrors(formErrors)
    }
  }, [values, submitAttempted, validateForm])
  
  return {
    // Values and state
    values,
    errors,
    touched,
    isSubmitting,
    submitAttempted,
    isValid,
    isDirty,
    hasErrors,
    
    // Actions
    setFieldValue,
    setFieldTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    validateField,
    validateForm,
    
    // Helpers
    getFieldProps,
    getFieldState,
    
    // Validation rules (for custom use)
    validationRules
  }
}

export default useFormValidation

// Helper function to create validation schema
export const createValidationSchema = (schema) => schema

// Common validation patterns
export const commonValidations = {
  brandName: [
    { rule: 'required', message: 'Brand name is required' },
    { rule: 'brandName' }
  ],
  
  email: [
    { rule: 'required', message: 'Email is required' },
    { rule: 'email' }
  ],
  
  password: [
    { rule: 'required', message: 'Password is required' },
    { rule: 'password' }
  ],
  
  confirmPassword: (passwordField = 'password') => [
    { rule: 'required', message: 'Please confirm your password' },
    { rule: 'confirmPassword', originalField: passwordField }
  ],
  
  website: [
    { rule: 'url', message: 'Please enter a valid website URL' }
  ],
  
  companySize: [
    { rule: 'required', message: 'Please select company size' }
  ],
  
  brandAssets: [
    { rule: 'fileSize', maxSizeInMB: 10, message: 'Each file must be less than 10MB' },
    { rule: 'fileType', allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] }
  ]
}