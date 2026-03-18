---
enabled: false
provider: null
api_key: null

title: "Wellness Package Payment"
description: "Use this shell to collect payment for consultation bundles and personalized wellness packages."
card_label: "Card Number"
card_placeholder: "1234 5678 9012 3456"
expiry_label: "Expiry"
expiry_placeholder: "MM/YY"
cvc_label: "CVC"
cvc_placeholder: "123"
name_label: "Name on Card"
name_placeholder: "Client name"
pay_button: "Pay For Package"
processing_text: "Processing..."
trust_badges:
  - icon: "lock"
    text: "Secure checkout"
  - icon: "heart"
    text: "Client care flow"
  - icon: "check-circle"
    text: "Package payment"
summary_title: "Package Summary"
subtotal_label: "Package"
tax_label: "Tax"
total_label: "Total Due"
success:
  title: "Payment State"
  message: "Use this once Stripe or your chosen provider confirms the wellness package payment."
  cta: "View Details"
error:
  title: "Payment Retry"
  message: "Use this state to handle payment failures or validation issues."
  retry: "Try Again"
---
