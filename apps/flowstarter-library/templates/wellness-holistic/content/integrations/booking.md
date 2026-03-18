---
enabled: false
provider: null
calendly_url: ""
calcom_url: ""

title: "Schedule A Wellness Consultation"
description: "Offer a calm intake flow for naturopathic, nutrition, and wellness planning consultations."
cta: "Request Consultation"
available_label: "Available Consultations"
timezone_label: "Times shown in clinic local time"
slots:
  - day: "Tuesday"
    times: ["9:30 AM", "12:00 PM", "3:30 PM"]
  - day: "Thursday"
    times: ["10:00 AM", "1:00 PM", "5:00 PM"]
  - day: "Sunday"
    times: ["10:30 AM", "1:30 PM", "4:00 PM"]
fields:
  - name: "name"
    label: "Full Name"
    placeholder: "Your name"
    required: true
  - name: "email"
    label: "Email"
    type: "email"
    placeholder: "you@example.com"
    required: true
  - name: "phone"
    label: "Phone"
    type: "tel"
    placeholder: "+1 (555) 000-0000"
    required: false
  - name: "preferred_date"
    label: "Preferred Date"
    type: "date"
    required: true
  - name: "wellness_goals"
    label: "Wellness Goals"
    type: "textarea"
    placeholder: "Share the support you are seeking and any current concerns"
    required: false
confirmation:
  title: "Consultation Request Saved"
  message: "Use this shell for intake collection. Final appointment logic is wired separately through Supabase or your booking provider."
---
