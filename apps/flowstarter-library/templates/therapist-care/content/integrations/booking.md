---
enabled: false
provider: cal
embed_url: null
cal_link: ""
cal_event_label: "20-minute intro call"
cal_duration_label: "20 minutes · video or phone · confidential"
cal_layout: "month_view"

title: "Choose a time that feels right."
description: "A 20-minute intro call to talk briefly about what's bringing you here and answer your questions. Calm, confidential, no commitment."
cta: "Confirm Appointment"

available_label: "Available Times"
timezone_label: "Times shown in your timezone"
slots:
  - day: "Tomorrow"
    times: ["10:00 AM", "2:00 PM", "4:00 PM"]
  - day: "Wednesday"
    times: ["9:00 AM", "11:00 AM", "3:00 PM"]
  - day: "Thursday"
    times: ["10:00 AM", "1:00 PM", "4:00 PM"]

fields:
  - name: "name"
    label: "Your Name"
    placeholder: "Your name"
    required: true
  - name: "email"
    label: "Email"
    placeholder: "you@example.com"
    required: true
  - name: "phone"
    label: "Phone"
    placeholder: "+34 611 482 903"
    required: true
  - name: "concern"
    label: "What brings you to therapy?"
    placeholder: "Share as much or as little as you're comfortable with..."
    required: false
    type: "textarea"

confirmation:
  title: "You're All Set"
  message: "Check your email for confirmation. Looking forward to connecting with you."
---
