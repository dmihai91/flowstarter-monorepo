---
enabled: false
provider: null
action_url: ""
success_message: "Thank you for reaching out! We'll be in touch within 24 hours."

title: "Apply for coaching"
description: "Tell me what you are training for, what is not clicking yet, and whether you want in-person or online coaching."

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
    placeholder: "+40 721 234 567"
    type: "tel"
    required: false
    width: "half"
  - name: "inquiry_type"
    label: "I'm interested in"
    placeholder: "Select an option"
    type: "select"
    required: true
    width: "half"
    options:
      - "1:1 coaching"
      - "Hybrid coaching"
      - "Powerlifting prep"
      - "Return from injury"
      - "General question"
  - name: "message"
    label: "Your Message"
    placeholder: "Share your training goal, current level, and the biggest thing holding progress back."
    type: "textarea"
    required: true
    width: "full"
    rows: 5

submit_text: "Send application"
submitting_text: "Sending..."

validation:
  required: "This field is required"
  email: "Please enter a valid email"
  phone: "Please enter a valid phone number"

success:
  title: "Application received"
  message: "Thanks. I will review it and reply with the next step within 24 hours."

error:
  title: "Something went wrong"
  message: "Please try again or reach out directly by email."
---
