---
enabled: true
provider: cal
calendly_url: ""
calcom_url: ""
cal_link: "creative-studio/project-intro"
cal_event_label: "30-minute project intro"
cal_duration_label: "30 minutes · video · free"
cal_layout: "month_view"

title: "Open a slot for the project."
description: "Talk through deliverables, timeline, and budget in a focused 30-minute call. We will leave the call with a clear next step — proposal, sprint, or polite no."
cta: "Request Discovery Call"
available_label: "Open Call Windows"
timezone_label: "Times shown in your local timezone"
slots:
  - day: "Monday"
    times: ["11:00 AM", "2:00 PM", "4:30 PM"]
  - day: "Wednesday"
    times: ["10:30 AM", "1:30 PM", "5:00 PM"]
  - day: "Friday"
    times: ["9:30 AM", "12:00 PM", "3:00 PM"]
fields:
  - name: "name"
    label: "Name"
    placeholder: "Your name"
    required: true
  - name: "email"
    label: "Email"
    type: "email"
    placeholder: "you@example.com"
    required: true
  - name: "company"
    label: "Company / Brand"
    placeholder: "Brand name"
    required: false
  - name: "target_date"
    label: "Preferred Call Date"
    type: "date"
    required: true
  - name: "project_scope"
    label: "Project Scope"
    type: "textarea"
    placeholder: "Describe the deliverable, goals, and budget range"
    required: true
confirmation:
  title: "Call Request Captured"
  message: "This shell is ready for Supabase-backed lead routing and calendar confirmation."
---
