---
enabled: false
provider: null
api_key: null

title: "Secure Payment"
description: "Your payment information is protected with bank-level encryption."

card_label: "Card Number"
card_placeholder: "1234 5678 9012 3456"
expiry_label: "Expiry"
expiry_placeholder: "MM/YY"
cvc_label: "CVC"
cvc_placeholder: "123"
name_label: "Name on Card"
name_placeholder: "Your name"

pay_button: "Complete Payment"
processing_text: "Processing..."

trust_badges:
  - icon: "lucide:shield-check"
    text: "HIPAA Compliant"
  - icon: "lucide:lock"
    text: "256-bit Encryption"
  - icon: "lucide:credit-card"
    text: "Secure Payment"

summary_title: "Session Summary"
subtotal_label: "Subtotal"
tax_label: "Tax"
total_label: "Total"

success:
  title: "Payment Complete"
  message: "Your session is confirmed. You'll receive details via email shortly."
  cta: "View Confirmation"

error:
  title: "Payment Issue"
  message: "Something went wrong. Please try again or contact us for assistance."
  retry: "Try Again"
---
