---
enabled: false
provider: null
calendly_url: ""
calcom_url: ""

title: "Reserve Your Appointment"
description: "Offer guests a polished booking flow for signature hair, makeup, and beauty appointments."
cta: "Request Appointment"
available_label: "This Week's Openings"
timezone_label: "Appointments shown in studio local time"
slots:
  - day: "Tuesday"
    times: ["10:00 AM", "1:30 PM", "4:00 PM"]
  - day: "Thursday"
    times: ["9:00 AM", "12:30 PM", "3:30 PM"]
  - day: "Saturday"
    times: ["8:30 AM", "11:00 AM", "2:00 PM"]
fields:
  - name: "name"
    label: "Full Name"
    placeholder: "Client name"
    required: true
  - name: "email"
    label: "Email"
    type: "email"
    placeholder: "client@example.com"
    required: true
  - name: "phone"
    label: "Phone"
    type: "tel"
    placeholder: "+1 (555) 000-0000"
    required: true
  - name: "appointment_date"
    label: "Preferred Date"
    type: "date"
    required: true
  - name: "service_notes"
    label: "Hair / Makeup Notes"
    type: "textarea"
    placeholder: "Tell us the service, inspiration, and any prep details"
    required: false
confirmation:
  title: "Appointment Request Captured"
  message: "Use this shell to collect inquiry details. Final scheduling, reminders, and confirmation happen through Supabase or your booking tool."
---
