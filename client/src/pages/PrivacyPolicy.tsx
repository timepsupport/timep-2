const PrivacyPolicy = () => {
 return(
   <><div className="fixed inset-0 -z-1 pointer-events-none">
     <div className="absolute left-1/2 top-20 -translate-x-1/2 w-245 h-115 bg-linear-to-tr from-pink-800/35 to-transparent rounded-full blur-3xl"></div>
     <div className="absolute right-12 bottom-10 w-105 h-55 bg-linear-to-bl from-red-700/35 to-transparent rounded-full blur-2xl">
     </div>
   </div>
   <div className="min-h-screen pt-32 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 lg:pb-8">
   <div className="bg-white/6 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-white/10 text-gray-300">
       <div className="text-center mb-16">
         <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent mb-6">
           Privacy Policy
         </h1>
       </div>
       <div className="space-y-8">
         <section>
           <h2 className="text-xl font-medium text-white b-4">1. Introduction</h2>
           <div className="text-gray-300 text-sm leading-relaxed">
             <p>
               "Welcome to "
               <strong>Timep</strong>
               ". We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our AI-powered tip generation services."
             </p>
           </div>
         </section>
         <section>
           <h2 className="text-xl font-medium text-white mb-4">2. Information We Collect</h2>
           <div className="text-grey-300 text-sm leading-relaxed">
             <p className="mb-4">We may collect the following types of data:</p>
             <ul className="list-disc pl-6 space-y-2"><li><strong>Identity Data:</strong> name, username.</li><li><strong>Contact Data:</strong> email address.</li><li><strong>Account Data:</strong> login status, subscription details.</li><li><strong>Technical Data:</strong> IP address, browser type, device information.</li><li><strong>Usage Data:</strong> interactions with our website and tools.</li></ul>
           </div>
         </section>
         <section>
           <h2 className="text-xl font-medium text-white mb-4">3. User Content &amp; AI Processing</h2>
           <div className="text-gray-300 text-sm leading-relaxed">
             <p className="mb-4">When using Timep, you may upload images, text prompts, or branding assets (“User Content”) for the purpose of generating these tips.</p>
             <ul className="list-disc pl-6 space-y-2"><li>User Content is processed solely to provide the requested service.</li><li><strong>We do not train AI models on your content.</strong></li><li>Your content is not shared publicly or reused without permission.</li><li>Third-party AI services, if used, are bound by strict data-protection agreements.</li></ul>
           </div>
         </section>
         <section>
           <h2 className="text-xl font-medium text-white mb-4">4. How We Use Your Data</h2>
           <div className="text-gray-300 text-sm leading-relaxed">
             <p className="mb-4">We use your data only when legally permitted, including to:</p>
             <ul className="list-disc pl-6 space-y-2"><li>Provide and operate our services.</li><li>Generate AI-powered tips.</li><li>Improve performance, reliability, and security.</li><li>Communicate service-related updates.</li><li>Comply with legal obligations.</li></ul>
           </div>
         </section>
         <section>
           <h2 className="text-xl font-medium text-white mb-4">5. Data Retention &amp; Security</h2>
           <div className="text-gray-300 text-sm leading-relaxed">
             <p className="mb-4">We retain personal data and user content only as long as necessary to provide the service or comply with legal requirements.</p><p>We apply appropriate technical and organizational security measures, including encrypted connections and restricted internal access, to protect your data.</p>
           </div>
         </section>
         <section>
           <h2 className="text-xl font-medium text-white mb-4">6. Your Privacy Rights</h2>
           <div className="text-gray-300 text-sm leading-relaxed">
             <p>Depending on your location, you may have the right to access, correct, or delete your personal data, object to processing, or withdraw consent at any time. Requests can be made through our Contact page.</p>
           </div>
         </section>
         <section>
           <h2 className="text-xl font-medium text-white mb-4">7. Contact Us</h2>
           <div className="text-gray-300 text-sm leading-relaxed"><p>If you have any questions about this Privacy Policy or how we handle your data, please contact us via our Contact page or email us at<strong> timepsupport@gmail.com</strong>.</p>
           </div>
         </section>
         <div className="pt-8 border-t border-white/10 text-sm text-gray-500">Last updated: 01-03-2026</div>
       </div>
     </div>
     </div></>
);
};

export default PrivacyPolicy;

