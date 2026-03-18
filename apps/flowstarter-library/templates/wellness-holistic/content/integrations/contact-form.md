---
enabled: false
provider: null
action_url: null

title: "Wellness Inquiry Form"
description: "Provide a grounded intake form for prospective clients exploring personalized holistic support."
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
  - name: "service_interest"
    label: "Service Interest"
    placeholder: "Choose a focus area"
    type: "select"
    required: true
    width: "half"
    options:
      - "Initial Consultation"
      - "Nutrition Guidance"
      - "Acupuncture"
      - "Massage Therapy"
      - "Wellness Package"
  - name: "message"
    label: "Health Goals"
    placeholder: "Share what balance, energy, or recovery support you are looking for"
    type: "textarea"
    required: true
    width: "full"
    rows: 5
submit_text: "Send Inquiry"
submitting_text: "Sending..."
validation:
  required: "Required fields support a more accurate consultation response."
  email: "Use a valid email for care follow-up."
  phone: "Use a valid phone number if you want text or call follow-up."
success:
  title: "Inquiry State"
  message: "Connect this shell to Supabase to store wellness inquiries and automate responses."
error:
  title: "Fallback State"
  message: "Use this error message after your form endpoint is connected."
---
