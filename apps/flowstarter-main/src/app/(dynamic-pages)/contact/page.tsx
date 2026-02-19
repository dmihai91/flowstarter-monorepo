import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Clock,
  Headphones,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
} from 'lucide-react';

export default function ContactPage() {
  const contactMethods = [
    {
      icon: <Mail className="h-6 w-6" />,
      title: 'Email Support',
      description: 'Get help with your account, billing, or technical issues',
      contact: 'support@flowstarter.com',
      response: 'Response within 24 hours',
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      contact: 'Available in dashboard',
      response: 'Instant response',
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: 'Phone Support',
      description: 'Speak directly with our technical experts',
      contact: '+1 (555) 123-4567',
      response: 'Mon-Fri, 9 AM - 6 PM PST',
    },
  ];

  const businessContacts = [
    {
      icon: <Mail className="h-6 w-6" />,
      title: 'Sales Inquiries',
      email: 'sales@flowstarter.com',
      description:
        'Questions about pricing, enterprise plans, or custom solutions',
    },
    {
      icon: <Headphones className="h-6 w-6" />,
      title: 'Partnership',
      email: 'partnerships@flowstarter.com',
      description:
        'Integration partnerships, affiliate programs, and collaborations',
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: 'Media & Press',
      email: 'press@flowstarter.com',
      description: 'Press inquiries, interviews, and media kit requests',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative bg-white dark:bg-gray-900 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-5xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <MessageSquare
                  className="h-8 w-8"
                  style={{ color: 'var(--blue)' }}
                />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-5xl mx-auto leading-relaxed">
              We're here to help you succeed. Reach out to our team with any
              questions, feedback, or support needs.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Methods */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How Can We Help?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Choose the best way to reach us based on your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {contactMethods.map((method, index) => (
              <Card
                key={index}
                className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-xl text-center [@media(hover:hover)]:hover:shadow-2xl transition-all duration-300 [@media(hover:hover)]:hover:scale-105"
              >
                <CardContent className="p-8">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-linear-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    {method.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {method.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    {method.description}
                  </p>
                  <div className="space-y-2">
                    <p className="font-semibold text-blue-600 dark:text-blue-400">
                      {method.contact}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-900/20"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {method.response}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-xl">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Send us a Message
                </h3>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name
                      </label>
                      <Input
                        placeholder="John"
                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Name
                      </label>
                      <Input
                        placeholder="Doe"
                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject
                    </label>
                    <Select>
                      <SelectTrigger className="h-10 rounded-md border border-gray-300 bg-white/90 text-gray-900 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:focus:border-blue-400">
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent className="border border-gray-200 dark:border-gray-600 rounded-md shadow-lg bg:(var(--surface-2))">
                        <SelectItem value="general">General Support</SelectItem>
                        <SelectItem value="technical">
                          Technical Issue
                        </SelectItem>
                        <SelectItem value="billing">
                          Billing Question
                        </SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="partnership">
                          Partnership Inquiry
                        </SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message
                    </label>
                    <Textarea
                      placeholder="Tell us how we can help you..."
                      rows={6}
                      className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600"
                    />
                  </div>

                  <Button className="w-full bg-linear-to-r from-blue-600 to-purple-600 [@media(hover:hover)]:hover:from-blue-700 [@media(hover:hover)]:hover:to-purple-700 text-white">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Business Contacts */}
            <div className="space-y-6">
              <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-xl">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Business Contacts
                  </h3>
                  <div className="space-y-6">
                    {businessContacts.map((contact, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                          {contact.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {contact.title}
                          </h4>
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-blue-600 dark:text-blue-400 font-medium [@media(hover:hover)]:hover:underline"
                          >
                            {contact.email}
                          </a>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                            {contact.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-lg bg-linear-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Our Office
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Headquarters
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        123 Innovation Drive
                        <br />
                        San Francisco, CA 94107
                        <br />
                        United States
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Office Hours
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        Monday - Friday: 9:00 AM - 6:00 PM PST
                        <br />
                        Saturday - Sunday: Closed
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg:(var(--surface-2))">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Quick answers to common questions. Need more help? Feel free to
              contact us.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-xl">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  How quickly do you respond to support requests?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We aim to respond to all support requests within 24 hours.
                  Priority support customers receive responses within 4 hours
                  during business hours.
                </p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-xl">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Do you offer phone support?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes! Phone support is available Monday through Friday, 9 AM to
                  6 PM PST. You can reach us at +1 (555) 123-4567.
                </p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-xl">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Can I schedule a demo or consultation?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Absolutely! Contact our sales team at sales@flowstarter.com to
                  schedule a personalized demo or consultation.
                </p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border border-white/40 shadow-xl">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Do you have a knowledge base?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes! Visit our Help Center for detailed guides, tutorials, and
                  troubleshooting articles to help you get the most out of
                  Flowstarter.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <a
              href="/help"
              className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-xl text-gray-700 dark:text-gray-300 bg:(var(--surface-2)) [@media(hover:hover)]:hover:bg-gray-50 dark:[@media(hover:hover)]:hover:bg-gray-700 transition-all duration-200 shadow-lg [@media(hover:hover)]:hover:shadow-xl"
            >
              Visit Help Center
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
