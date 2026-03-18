---
enabled: false
provider: null
action_url: null

title: "Beauty Concierge Contact"
description: "Capture bridal, editorial, and premium salon inquiries with a real form shell that’s ready for backend wiring."
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
    placeholder: "+1 (555) 000-0000"
    type: "tel"
    required: false
    width: "half"
  - name: "service_type"
    label: "Service Type"
    placeholder: "Choose a service"
    type: "select"
    required: true
    width: "half"
    options:
      - "Hair Styling"
      - "Event Makeup"
      - "Bridal Beauty"
      - "Editorial / Campaign"
      - "General Inquiry"
  - name: "message"
    label: "Project Notes"
    placeholder: "Share timing, location, and the look you're after"
    type: "textarea"
    required: true
    width: "full"
    rows: 5
submit_text: "Send Inquiry"
submitting_text: "Sending..."
validation:
  required: "Marked fields should be completed before submission."
  email: "Use a valid email so confirmations can be delivered."
  phone: "Provide a valid number when you'd like a callback."
success:
  title: "Inquiry Ready"
  message: "Frontend shell complete. Connect Supabase or your CRM endpoint to deliver messages."
error:
  title: "Delivery Placeholder"
  message: "This state is included for backend handling once the endpoint is connected."
---
