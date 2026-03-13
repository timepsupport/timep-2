import { FolderEditIcon, ZapIcon, MenuIcon, SparkleIcon, XIcon, UserIcon, GraduationCap } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useUser, UserButton } from "@clerk/clerk-react";
import { useCredits } from "../context/CreditsContext";

export default function Navbar() {
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const { credits, reviewCount, streak, completedToday } = useCredits();
  const navigate = useNavigate();

  const role = (user?.unsafeMetadata?.role as string) || "student";

  const handleToggleRole = async () => {
    const newRole = role === "student" ? "professor" : "student";
    await user?.update({ unsafeMetadata: { ...user.unsafeMetadata, role: newRole } });
  };

  return (
    <>
      <motion.nav
        className="fixed top-0 z-50 flex items-center justify-between w-full py-4 px-6 md:px-16 lg:px-24 xl:px-32 backdrop-blur"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
      >
        <Link to='/' className="text-white font-bold text-xl tracking-tight">
          Timep.
        </Link>

        <div className="hidden md:flex items-center gap-8 transition duration-500">
          <Link to='/' className="hover:text-pink-500 transition">Home</Link>
          <Link to='/generate' className="hover:text-pink-500 transition">Generate</Link>
          {isSignedIn
            ? <Link to='/my-generation' className="hover:text-pink-500 transition">My Generations</Link>
            : <Link to='/About' className="hover:text-pink-500 transition">About</Link>
          }
          <Link to='/Community' className="hover:text-pink-500 transition">Community</Link>
        </div>

        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/daily-boost')}
                className="flex items-center gap-2 text-gray-300 hover:text-white border border-white/10 bg-white/5 px-4 py-1.5 rounded-full text-sm transition hover:bg-white/10"
                title="Daily Boost"
              >
                <span>{completedToday ? '✅' : '🔥'}</span>
                <span className="text-orange-400 font-semibold">{streak}</span>
              </button>
              <button
                onClick={() => navigate('/credits')}
                className="flex items-center gap-2 text-gray-300 hover:text-white border border-white/10 bg-white/5 px-4 py-1.5 rounded-full text-sm transition hover:bg-white/10"
              >
                Credits: <span className="text-white font-semibold">{credits ?? '...'}</span>
              </button>

              <div className="relative">
                {reviewCount > 0 && (
                  <span className="absolute -top-1 -right-1 z-10 bg-pink-600 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center pointer-events-none">
                    {reviewCount > 9 ? '9+' : reviewCount}
                  </span>
                )}
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'size-8',
                      userButtonPopoverCustomItemButton: 'text-white opacity-100 hover:text-pink-500 hover:bg-transparent',
                    }
                  }}
                >
                  <UserButton.MenuItems>
                    {/* Role toggle */}
                    <UserButton.Action
                      label={role === "student" ? "Switch to Professor" : "Switch to Student"}
                      labelIcon={<GraduationCap size={14} />}
                      onClick={handleToggleRole}
                    />
                    <UserButton.Action
                      label="My Analytics"
                      labelIcon={<SparkleIcon size={14} />}
                      onClick={() => navigate('/analytics')}
                    />
                    <UserButton.Action
                      label="Daily Boost"
                      labelIcon={<ZapIcon size={14} />}
                      onClick={() => navigate('/daily-boost')}
                    />
                    <UserButton.Action
                      label="How To Use"
                      labelIcon={<FolderEditIcon size={14} />}
                      onClick={() => navigate('/how-to-use')}
                    />
                  </UserButton.MenuItems>
                </UserButton>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/sign-in')}
              className="hidden md:block px-6 py-2.5 bg-pink-600 hover:bg-pink-700 active:scale-95 transition-all rounded-full"
            >
              Get Started
            </button>
          )}

          <button onClick={() => setIsOpen(true)} className="md:hidden">
            <MenuIcon size={26} className="active:scale-90 transition" />
          </button>
        </div>
      </motion.nav>

      {/* Menu mobile */}
      <div className={`fixed inset-0 z-100 bg-black/40 backdrop-blur flex flex-col items-center justify-center text-lg gap-8 md:hidden transition-transform duration-400 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Link onClick={() => setIsOpen(false)} to='/'>Home</Link>
        <Link onClick={() => setIsOpen(false)} to='/generate'>Generate</Link>
        {isSignedIn
          ? <Link onClick={() => setIsOpen(false)} to='/my-generation'>My Generations</Link>
          : <Link onClick={() => setIsOpen(false)} to='/About'>About</Link>
        }
        <Link onClick={() => setIsOpen(false)} to='/Community'>Community</Link>
        {isSignedIn
          ? <UserButton />
          : <Link onClick={() => setIsOpen(false)} to='/sign-in'>Login</Link>
        }
        <button
          onClick={() => setIsOpen(false)}
          className="active:ring-3 active:ring-white aspect-square size-10 p-1 items-center justify-center bg-pink-600 hover:bg-pink-700 transition text-white rounded-md flex"
        >
          <XIcon />
        </button>
      </div>
    </>
  );
}