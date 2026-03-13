import { useState } from 'react';
import { ChevronRight, BookOpen, Sparkles, Zap, Users, BarChart3, Check, ArrowRight } from 'lucide-react';

const HowToUse = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const tutorials = [
    {
      title: 'Choose Your Topic',
      icon: BookOpen,
      description: 'Start by selecting a medical topic you want to master',
      steps: [
        'Navigate to the "Generate" page',
        'Search or browse medical topics (e.g., "Atrial Fibrillation", "Pneumothorax")',
        'Pick a topic that interests you',
      ],
      example: 'Example: Select "Acute Myocardial Infarction" to learn about heart attacks',
    },
    {
      title: 'Select Learning Style',
      icon: Sparkles,
      description: 'Choose how you want to learn the material',
      steps: [
        'Pick your preferred learning format (mnemonic, flowchart, story, etc.)',
        'Mnemonics: Memory aids using first letters',
        'Flowcharts: Visual step-by-step processes',
        'Stories: Clinical narratives to remember concepts',
        'Choose based on your learning style!',
      ],
      example: 'Tip: Use mnemonics if you\'re a visual learner, stories if you love narratives',
    },
    {
      title: 'Add Your Context',
      icon: Zap,
      description: 'Personalize the tip based on your interests',
      steps: [
        'Share your hobbies or interests (e.g., Music, James Bond movies, Real Madrid...)',
        'These become "cognitive anchors" for better retention',
        'The AI uses them to relate complex concepts to familiar areas',
      ],
      example: 'Example: If you love surgery, concepts are explained through a mini james bond like movie',
    },
    {
      title: 'Generate Your Tip',
      icon: Zap,
      description: 'Get a personalized learning tip instantly',
      steps: [
        'Click the "Generate" button (costs 1 credit)',
        'Watch as AI creates your custom learning material',
        'Tips appear in your "My Generations" folder',
        'Ready to study immediately!',
      ],
      example: 'Pro tip: Save your favorite tips for quick revision later',
    },
    {
      title: 'Study & Analyze',
      icon: BarChart3,
      description: 'Track your progress with detailed analytics',
      steps: [
        'Go to "My Analytics" to see your learning journey',
        'Track study hours, tips generated, and subject breakdown',
        'Identify your strongest and weakest subjects',
        'Optimize your study plan based on data',
      ],
      example: 'Your analytics show that you\'ve spent 23.3 hours studying, generating 100 tips',
    },
    {
      title: 'Collaborate & Learn',
      icon: Users,
      description: 'Study together with others in study groups',
      steps: [
        'Join study groups based on your interests',
        'Share tips, ask questions, and discuss concepts',
        'Real-time messaging with group members',
        'Build your medical knowledge community',
      ],
      example: 'Join "USMLE Prep 2024" group with 45 members actively studying',
    },
  ];

  const markStepComplete = (idx: number) => {
    if (!completedSteps.includes(idx)) {
      setCompletedSteps([...completedSteps, idx]);
    }
  };

  const currentTutorial = tutorials[activeStep];
  const Icon = currentTutorial.icon;
  const progress = ((activeStep + 1) / tutorials.length) * 100;

  return (
    <>
      <div className="fixed inset-0 -z-1 pointer-events-none">
        <div className="absolute left-1/2 top-20 -translate-x-1/2 w-245 h-115 bg-linear-to-tr from-pink-800/35 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute right-12 bottom-10 w-105 h-55 bg-linear-to-bl from-red-700/35 to-transparent rounded-full blur-2xl"></div>
      </div>

      <div className="min-h-screen pt-32 lg:pt-40 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-white/10 text-gray-300">
          {/* Header */}
          <h1 className="text-3xl md:text-5xl font-semibold mb-8">
            How To Use <br />
            <span className="bg-linear-to-r md:text-4xl from-pink-400 to-pink-600 bg-clip-text text-transparent">
              Timep
            </span>
          </h1>

          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Your Learning Journey</h2>
              <span className="text-sm text-gray-400">{activeStep + 1} of {tutorials.length}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-linear-to-r from-pink-400 to-pink-600 transition-all duration-700"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Left - Steps Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white/4 border border-white/8 rounded-xl p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-white mb-4">Steps</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {tutorials.map((tutorial, idx) => {
                    const TIcon = tutorial.icon;
                    const isActive = activeStep === idx;
                    const isCompleted = completedSteps.includes(idx);

                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveStep(idx)}
                        className={`w-full text-left p-4 rounded-lg transition-all border flex items-center gap-3 text-sm
                          ${
                            isActive
                              ? 'bg-linear-to-r from-pink-400/20 to-pink-600/20 border-pink-400/50'
                              : isCompleted
                              ? 'bg-white/3 border-white/8 hover:bg-white/5'
                              : 'bg-white/3 border-white/8 hover:bg-white/5'
                          }
                        `}
                      >
                        <div className="p-1.5">
                          <TIcon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate text-xs">{tutorial.title}</p>
                          <p className="text-gray-500 truncate text-xs">{tutorial.description}</p>
                        </div>
                        {isCompleted && <Check size={16} className="text-pink-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right - Content */}
            <div className="lg:col-span-2">
              <div className="bg-white/4 border border-white/8 rounded-xl p-8">
                {/* Icon & Title */}
                <div className="flex items-start gap-4 mb-8">
                  <div className="p-3 rounded-lg bg-linear-to-br from-pink-400/30 to-pink-600/30 border border-pink-400/20 flex-shrink-0">
                    <Icon size={28} className="text-pink-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold text-white mb-2">{currentTutorial.title}</h2>
                    <p className="text-gray-400 text-sm">{currentTutorial.description}</p>
                  </div>
                </div>

                {/* Steps */}
                <div className="mb-8 space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-6">Steps to Follow:</h3>
                  {currentTutorial.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex gap-4 p-4 bg-white/3 rounded-lg border border-white/8 hover:bg-white/5 transition group"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-linear-to-r from-pink-400 to-pink-600 flex-shrink-0 font-bold text-xs text-white group-hover:scale-110 transition-transform">
                        {idx + 1}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="text-gray-200 font-medium text-sm">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Example */}
                <div className="bg-white/3 rounded-lg border border-white/8 p-6 mb-8">
                  <div className="flex items-start gap-3">
                    <Sparkles size={18} className="text-pink-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-white mb-2 text-sm">💡 Helpful Tip</h4>
                      <p className="text-gray-300 text-sm">{currentTutorial.example}</p>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (activeStep > 0) setActiveStep(activeStep - 1);
                    }}
                    disabled={activeStep === 0}
                    className="flex-1 px-6 py-2.5 bg-white/8 hover:bg-white/12 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition font-medium text-white text-sm"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => markStepComplete(activeStep)}
                    className={`flex-1 px-6 py-2.5 rounded-lg transition font-medium text-sm flex items-center justify-center gap-2 ${
                      completedSteps.includes(activeStep)
                        ? 'bg-white/8 text-pink-400 border border-pink-400/20'
                        : 'bg-white/8 hover:bg-white/12 text-white'
                    }`}
                  >
                    {completedSteps.includes(activeStep) ? (
                      <>
                        <Check size={16} /> Completed
                      </>
                    ) : (
                      <>
                        <Check size={16} /> Mark Complete
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (activeStep < tutorials.length - 1) setActiveStep(activeStep + 1);
                    }}
                    disabled={activeStep === tutorials.length - 1}
                    className="flex-1 px-6 py-2.5 bg-linear-to-r from-pink-400 to-pink-600 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-transform rounded-lg font-medium text-white text-sm flex items-center justify-center gap-2"
                  >
                    Next <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-white/4 border border-white/8 rounded-xl p-8">
            <h2 className="text-2xl font-semibold text-white mb-8">Quick Tips to Get Started 🚀</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Use Multiple Formats', desc: 'Try different learning styles to find what works best for you' },
                { title: 'Build Your Knowledge', desc: 'Generate tips across multiple topics to create comprehensive knowledge' },
                { title: 'Track Progress', desc: 'Check your Analytics regularly to understand learning patterns' },
                { title: 'Collaborate & Share', desc: 'Join study groups to learn from others and share insights' },
                { title: 'Consistent Learning', desc: 'Aim for daily study sessions to maintain your learning streak' },
                { title: 'Review Regularly', desc: 'Revisit your generated tips for spaced repetition learning' },
              ].map((tip, idx) => (
                <div key={idx} className="p-6 bg-white/3 rounded-lg border border-white/8 hover:border-pink-400/20 transition group">
                  <div className="flex items-start gap-3">
                    <div className="text-xl flex-shrink-0">✨</div>
                    <div>
                      <h3 className="font-semibold text-white mb-2 text-sm group-hover:text-pink-300 transition">{tip.title}</h3>
                      <p className="text-xs text-gray-400">{tip.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          {completedSteps.length === tutorials.length && (
            <div className="mt-12 text-center p-8 bg-white/4 border border-white/8 rounded-xl">
              <h3 className="text-2xl font-semibold text-white mb-3">🎉 You're All Set!</h3>
              <p className="text-gray-400 mb-6 text-sm">You've completed the tutorial. Ready to start learning?</p>
              <a
                href="/generate"
                className="inline-flex items-center gap-2 px-8 py-3 bg-linear-to-r from-pink-400 to-pink-600 text-white font-semibold rounded-lg hover:scale-105 transition-transform"
              >
                Start Generating Tips <ChevronRight size={18} />
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HowToUse;