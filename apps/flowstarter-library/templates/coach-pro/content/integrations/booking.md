---
enabled: false
provider: cal
embed_url: null
# Cal.com handle: the path after cal.com/, e.g. "yourname/30min" or
# "team/discovery-call". Leave empty to render a configure-me placeholder.
cal_link: ""
cal_event_label: "30-minute discovery call"
cal_duration_label: "30 minutes · video · free"
cal_layout: "month_view"

title: "Pick a time that works."
description: "A 30-minute discovery call to talk through where you are, where you want to be, and whether coaching is the right next step. No pressure, no hard sell."
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
    placeholder: "+351 913 442 118"
    required: true
  - name: "concern"
    label: "What would you like support with?"
    placeholder: "A short note on the role, decision, or situation you want to work through..."
    required: false
    type: "textarea"

confirmation:
  title: "You're All Set"
  message: "Check your email for confirmation. Looking forward to connecting with you."
---
