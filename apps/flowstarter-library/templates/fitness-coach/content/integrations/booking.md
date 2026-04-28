---
enabled: true
provider: cal
embed_url: null
cal_link: "fitness-coach/free-session"
cal_event_label: "Free assessment session"
cal_duration_label: "45 minutes · in-person or video · free"
cal_layout: "month_view"

title: "Lock in your free assessment."
description: "Pick a time and we will run a 45-minute movement and goals assessment. You'll leave with a written next-step plan whether we keep training together or not."
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
    placeholder: "+1 (555) 000-0000"
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
