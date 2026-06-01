---
enabled: false
provider: cal
embed_url: null
cal_link: ""
cal_event_label: "15-minute intro call"
cal_duration_label: "15 minutes · video or phone"
cal_layout: "month_view"

title: "Let's talk it through"
description: "A quick call to hear about your day, talk timelines, and see if we're a good fit. No hard sell, and no need to have everything figured out yet."
cta: "Book the call"

available_label: "Available times"
timezone_label: "Times shown in your timezone"
slots:
  - day: "Tomorrow"
    times: ["10:00 AM", "1:00 PM", "5:00 PM"]
  - day: "Thursday"
    times: ["9:30 AM", "12:00 PM", "3:30 PM"]
  - day: "Saturday"
    times: ["10:00 AM", "11:30 AM"]

fields:
  - name: "name"
    label: "Your names"
    placeholder: "You and your partner"
    required: true
  - name: "email"
    label: "Email"
    placeholder: "you@example.com"
    required: true
  - name: "phone"
    label: "Phone"
    placeholder: "+1 503 555 0147"
    required: true
  - name: "concern"
    label: "What's the day?"
    placeholder: "Date, location, and roughly how many guests..."
    required: false
    type: "textarea"

confirmation:
  title: "You're on the calendar"
  message: "Check your email for the details. Looking forward to hearing about your day."
---
