import { MailIcon, LocateIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import api from "../configs/api";
import toast from "react-hot-toast";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/api/contact', form);
      toast.success("Message sent! We'll get back to you soon.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 -z-1 pointer-events-none">
        <div className="absolute left-1/2 top-20 -translate-x-1/2 w-245 h-115 bg-linear-to-tr from-pink-800/35 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute right-12 bottom-10 w-105 h-55 bg-linear-to-bl from-red-700/35 to-transparent rounded-full blur-2xl"></div>
      </div>
      <div className="min-h-screen pt-32 lg:pt-40 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16">

          {/* Left — info */}
          <div className="space-y-8">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent mb-6">
                Get in Touch
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Have a question, feedback, or need support? We'd love to hear from you. Fill out the form and we'll get back to you as soon as possible.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 text-gray-300">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <MailIcon className="size-6" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Email</h4>
                  <p className="text-sm text-gray-400">timepsupport@gmail.com</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-gray-300">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <LocateIcon className="size-6" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Response Time</h4>
                  <p className="text-sm text-gray-400">Within 24–48 hours on business days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300">Name</label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all placeholder:text-gray-400"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300">Email</label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Subject</label>
                <input
                  required
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all placeholder:text-gray-400"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Message</label>
                <textarea
                  required
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us more about your inquiry..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all resize-none placeholder:text-gray-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-linear-to-b from-pink-500 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-pink-500/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="size-4 animate-spin" /> Sending...</> : "Send Message"}
              </button>
            </form>
          </div>

        </div>
      </div>
    </>
  );
};

export default Contact;