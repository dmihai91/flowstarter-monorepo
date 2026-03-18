---
enabled: false
provider: null
api_key: null

title: "Appointment Deposit"
description: "Use this payment shell for non-refundable booking deposits on premium beauty services."
card_label: "Card Number"
card_placeholder: "1234 5678 9012 3456"
expiry_label: "Expiry"
expiry_placeholder: "MM/YY"
cvc_label: "CVC"
cvc_placeholder: "123"
name_label: "Name on Card"
name_placeholder: "Client name"
pay_button: "Pay Deposit"
processing_text: "Processing..."
trust_badges:
  - icon: "lock"
    text: "Secure checkout"
  - icon: "check-circle"
    text: "Deposit tracking"
  - icon: "sparkles"
    text: "Client-ready flow"
summary_title: "Deposit Summary"
subtotal_label: "Deposit"
tax_label: "Tax"
total_label: "Due Today"
success:
  title: "Deposit Received"
  message: "Use this state after Supabase or Stripe confirms the appointment deposit."
  cta: "View Booking"
error:
  title: "Payment Retry"
  message: "Wire this error state to your payment provider response."
  retry: "Try Again"
---
