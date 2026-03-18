---
enabled: false
provider: null
action_url: null

title: "Project Inquiry Form"
description: "Use a direct, qualified intake form for brand, editorial, and digital design work."
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
  - name: "company"
    label: "Company"
    placeholder: "Studio or brand"
    type: "text"
    required: false
    width: "half"
  - name: "project_type"
    label: "Project Type"
    placeholder: "Select one"
    type: "select"
    required: true
    width: "half"
    options:
      - "Brand Identity"
      - "Campaign Creative"
      - "Photography"
      - "Web Design"
      - "Retainer"
  - name: "message"
    label: "Project Brief"
    placeholder: "Share objectives, timeline, and budget considerations"
    type: "textarea"
    required: true
    width: "full"
    rows: 5
submit_text: "Send Brief"
submitting_text: "Sending..."
validation:
  required: "Required fields help qualify serious project inquiries."
  email: "Use a valid email to receive the proposal reply."
  phone: "Add a valid phone if you want callback availability."
success:
  title: "Brief Ready"
  message: "Connect this form to Supabase to create project leads and notifications."
error:
  title: "Fallback State"
  message: "Reserve this state for API or validation failures once connected."
---
