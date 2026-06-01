---
enabled: false
provider: null
action_url: ""
success_message: "Thank you for reaching out! We'll be in touch within 24 hours."

title: "Reach out"
description: "Questions about therapy, availability, or fit are welcome. All inquiries are handled privately and with care."

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
    placeholder: "+34 612 345 678"
    type: "tel"
    required: false
    width: "half"
  - name: "inquiry_type"
    label: "I'm Interested In"
    placeholder: "Select an option"
    type: "select"
    required: true
    width: "half"
    options:
      - "Individual Therapy"
      - "Couples Counseling"
      - "Anxiety or Depression Support"
      - "Grief Counseling"
      - "General Question"
  - name: "message"
    label: "Your Message"
    placeholder: "Share what's on your mind..."
    type: "textarea"
    required: true
    width: "full"
    rows: 5

submit_text: "Send a private email"
submitting_text: "Sending..."

validation:
  required: "This field is required"
  email: "Please enter a valid email"
  phone: "Please enter a valid phone number"

success:
  title: "Message Received"
  message: "Thank you for reaching out. I'll respond within 24 hours. All communications are confidential."

error:
  title: "Something Went Wrong"
  message: "Please try again or call the office directly."
---
