---
enabled: false
provider: null
action_url: ""
success_message: "Thank you for reaching out! We'll be in touch within 24 hours."

title: "Start the conversation"
description: "If you are exploring leadership support for yourself or your team, send a note with context and I will reply with next steps."

fields:
  - name: "name"
    label: "Name"
    placeholder: "Your name"
    type: "text"
    required: true
    width: "half"
  - name: "email"
    label: "Email"
    placeholder: "you@example.com"
    type: "email"
    required: true
    width: "half"
  - name: "phone"
    label: "Phone"
    placeholder: "+351 912 345 678"
    type: "tel"
    required: false
    width: "half"
  - name: "inquiry_type"
    label: "I need help with"
    placeholder: "Select an option"
    type: "select"
    required: true
    width: "half"
    options:
      - "Founder coaching"
      - "Leadership communication"
      - "Executive team offsite"
      - "Advisory retainer"
      - "General inquiry"
  - name: "message"
    label: "Your Message"
    placeholder: "Tell me what is changing, where the friction is, and what kind of support would be useful."
    type: "textarea"
    required: true
    width: "full"
    rows: 5

submit_text: "Send inquiry"
submitting_text: "Sending..."

validation:
  required: "This field is required"
  email: "Please enter a valid email"
  phone: "Please enter a valid phone number"

success:
  title: "Inquiry received"
  message: "Thanks for reaching out. You will hear back within one business day."

error:
  title: "Something went wrong"
  message: "Please try again or email directly."
---
