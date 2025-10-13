// Shared utility for generating consistent student credentials

export const generateStudentId = (name: string): string => {
  // Create student ID from first 2 letters of first name + first 2 letters of last name + deterministic 3 digits
  const nameParts = name.trim().split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts[nameParts.length - 1] || ''
  
  const firstTwo = firstName.substring(0, 2).toUpperCase()
  const lastTwo = lastName.substring(0, 2).toUpperCase()
  
  // Generate deterministic 3-digit number based on name hash
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  const deterministicDigits = Math.abs(hash) % 900 + 100 // 3-digit number (100-999)
  
  return `${firstTwo}${lastTwo}${deterministicDigits}`
}

export const generateRandomPassword = (): string => {
  // Generate a random 8-character password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Deterministic password generation based on name (for consistent login)
export const generateDeterministicPassword = (name: string): string => {
  // Use name as seed for consistent password generation
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Use hash to generate consistent password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  let seed = Math.abs(hash)
  
  for (let i = 0; i < 8; i++) {
    password += chars[seed % chars.length]
    seed = Math.floor(seed / chars.length)
  }
  
  return password
}
