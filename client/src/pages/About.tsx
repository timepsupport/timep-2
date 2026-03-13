import { BrainIcon, ZapIcon, BookOpenIcon } from "lucide-react";

const About = () => {
  return (
    <><div className="fixed inset-0 -z-1 pointer-events-none">
     <div className="absolute left-1/2 top-20 -translate-x-1/2 w-245 h-115 bg-linear-to-tr from-pink-800/35 to-transparent rounded-full blur-3xl"></div>
     <div className="absolute right-12 bottom-10 w-105 h-55 bg-linear-to-bl from-red-700/35 to-transparent rounded-full blur-2xl">
     </div>
   </div>
    <div className="min-h-screen pt-32 lg:pt-40 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-white/10 text-gray-300">

        <h1 className="text-3xl md:text-5xl font-semibold mb-8">
          About <br />
          <span className="bg-linear-to-r md:text-4xl from-pink-400 to-pink-600 bg-clip-text text-transparent">
            Timep AI
          </span>
        </h1>

        <div className="relative grid md:grid-cols-2 gap-12 items-start">

          {/* Left — main text */}
          <div className="space-y-4 leading-relaxed">
            <p>
              Timep is an AI-powered medical learning platform that generates personalized study tips for any medical topic. Instead of passive reading, Timep transforms your learning into active, structured sessions using proven cognitive formats.
            </p>
            <p>
              By combining AI with evidence-based learning techniques, Timep helps you build real, lasting understanding — not just surface-level memorization.
            </p>
            <p>
              Medical school is one of the most demanding academic journeys in the world. Traditional study methods — re-reading notes, passive flashcards, passive videos — are inefficient. Timep was built by people who understand this struggle and wanted to offer something better.
            </p>
          </div>

          {/* Right — sticky "Why Choose Us" card */}
          <div className="sticky top-20 bg-linear-to-br from-white/5 to-white/0 p-8 rounded-2xl border border-white/10">
            <h3 className="text-2xl font-semibold text-white mb-6">Why Choose Timep?</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <div className="p-2">
                  <ZapIcon className="size-4.5" />
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">Instant Generation</h4>
                  <p className="text-sm text-gray-400 max-w-xs">
                    Generate high-yield medical tips on any topic in seconds.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="p-2">
                  <BrainIcon className="size-4.5" />
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">AI-Powered Learning</h4>
                  <p className="text-sm text-gray-400 max-w-xs">
                    Using state-of-the-art AI to adapt tips to your learning style and interests.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="p-2">
                  <BookOpenIcon className="size-4.5" />
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">Multiple Formats</h4>
                  <p className="text-sm text-gray-400 max-w-xs">
                    Mnemonics, mindmaps, tables, timelines, cases — every format you need in one place.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom 3 cards */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="bg-white/4 border border-white/8 rounded-xl p-6">
            <h4 className="text-white font-medium mb-2">Built for Medical Students</h4>
            <p className="text-[13px] text-gray-400">
              From preclinical to clinical years — whether you're preparing for exams, rotations, or just keeping up with the curriculum.
            </p>
          </div>
          <div className="bg-white/4 border border-white/8 rounded-xl p-6">
            <h4 className="text-white font-medium mb-2">Learn Without Passive Reading</h4>
            <p className="text-[13px] text-gray-400">
              Enter any medical topic and let AI generate structured, ready-to-use tips you can review in minutes — no note-taking required.
            </p>
          </div>
          <div className="bg-white/4 border border-white/8 rounded-xl p-6">
            <h4 className="text-white font-medium mb-2">Stop Forgetting What You Study</h4>
            <p className="text-[13px] text-gray-400">
              Timep uses cognitive anchoring and active recall formats so the information actually sticks — not just for the exam, but for clinical practice.
            </p>
          </div>
        </div>

      </div>
    </div></>
  );
};

export default About;