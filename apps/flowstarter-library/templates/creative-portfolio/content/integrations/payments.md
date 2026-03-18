---
enabled: false
provider: null
api_key: null

title: "Project Deposit"
description: "Collect upfront retainers for design, photography, or content production projects."
card_label: "Card Number"
card_placeholder: "1234 5678 9012 3456"
expiry_label: "Expiry"
expiry_placeholder: "MM/YY"
cvc_label: "CVC"
cvc_placeholder: "123"
name_label: "Billing Name"
name_placeholder: "Client or company name"
pay_button: "Pay Deposit"
processing_text: "Processing..."
trust_badges:
  - icon: "lock"
    text: "Protected checkout"
  - icon: "monitor"
    text: "Project-ready shell"
  - icon: "check-circle"
    text: "Deposit workflow"
summary_title: "Deposit Summary"
subtotal_label: "Retainer"
tax_label: "Tax"
total_label: "Amount Due"
success:
  title: "Deposit State"
  message: "Connect this to your payment provider to confirm production kickoff."
  cta: "View Invoice"
error:
  title: "Payment Issue"
  message: "Use this state when the provider returns a failure response."
  retry: "Retry Payment"
---
