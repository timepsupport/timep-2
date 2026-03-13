'use client'
import { useState } from "react";
import SectionTitle from "../components/SectionTitle";
import { ArrowRightIcon, MailIcon, UserIcon, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import api from "../configs/api";
import toast from "react-hot-toast";

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      setLoading(true);
      await api.post('/api/contact', form);
      toast.success("Message sent! We'll get back to you soon.");
      setForm({ name: "", email: "", message: "" });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 md:px-16 lg:px-24 xl:px-32">
      <SectionTitle text1="Contact" text2="Reach out to us" text3="Ready to grow your learning? Let's connect and build something exceptional together." />
      <form onSubmit={handleSubmit} className='grid sm:grid-cols-2 gap-3 sm:gap-5 max-w-2xl mx-auto text-slate-300 mt-16 w-full'>
        
        <motion.div
          initial={{ y: 150, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 320, damping: 70, mass: 1 }}
        >
          <p className='mb-2 font-medium'>Your name</p>
          <div className='flex items-center pl-3 rounded-lg border border-slate-700 focus-within:border-pink-500'>
            <UserIcon className='size-5' />
            <input
              name='name'
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder='Enter your name'
              className='w-full p-3 outline-none bg-transparent'
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 150, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 280, damping: 70, mass: 1 }}
        >
          <p className='mb-2 font-medium'>Email id</p>
          <div className='flex items-center pl-3 rounded-lg border border-slate-700 focus-within:border-pink-500'>
            <MailIcon className='size-5' />
            <input
              name='email'
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder='Enter your email'
              className='w-full p-3 outline-none bg-transparent'
            />
          </div>
        </motion.div>

        <motion.div className='sm:col-span-2'
          initial={{ y: 150, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 240, damping: 70, mass: 1 }}
        >
          <p className='mb-2 font-medium'>Message</p>
          <textarea
            name='message'
            rows={8}
            value={form.message}
            onChange={handleChange}
            placeholder='Enter your message'
            className='focus:border-pink-500 resize-none w-full p-3 outline-none rounded-lg border border-slate-700 bg-transparent'
          />
        </motion.div>

        <motion.button
          type='submit'
          disabled={loading}
          className='w-max flex items-center gap-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-60 text-white px-10 py-3 rounded-full transition'
          initial={{ y: 150, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 280, damping: 70, mass: 1 }}
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : <ArrowRightIcon className="size-5" />}
          {loading ? "Sending..." : "Submit"}
        </motion.button>

      </form>
    </div>
  );
}