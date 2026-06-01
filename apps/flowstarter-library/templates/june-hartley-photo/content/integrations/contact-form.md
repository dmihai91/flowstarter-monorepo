---
enabled: false
provider: null
action_url: ""
success_message: "Thanks for reaching out. I'll get back to you within two days, usually sooner."

title: "Check your date"
description: "Tell me a little about your day and what you're after. I only take a limited number of weddings each season, so the sooner the better."

fields:
  - name: "name"
    label: "Your names"
    placeholder: "You and your partner"
    type: "text"
    required: true
    width: "half"
  - name: "email"
    label: "Email"
    placeholder: "you@example.com"
    type: "email"
    required: true
    width: "half"
  - name: "event_date"
    label: "Date (or rough timing)"
    placeholder: "e.g. late September 2026"
    type: "text"
    required: false
    width: "half"
  - name: "inquiry_type"
    label: "What are you after"
    placeholder: "Select an option"
    type: "select"
    required: true
    width: "half"
    options:
      - "Wedding"
      - "Elopement or small ceremony"
      - "Engagement or couples"
      - "Portraits or family"
      - "Editorial or brand"
  - name: "message"
    label: "Tell me about it"
    placeholder: "Where, roughly how many people, and what kind of day you're hoping for..."
    type: "textarea"
    required: true
    width: "full"
    rows: 5

submit_text: "Send the details"
submitting_text: "Sending..."

validation:
  required: "This field is required"
  email: "Please enter a valid email"
  phone: "Please enter a valid phone number"

success:
  title: "Got it"
  message: "Thanks for reaching out. I'll get back to you within two days, usually sooner."

error:
  title: "Something went wrong"
  message: "Please try again, or email hello@junehartley.com directly."
---
