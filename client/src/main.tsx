import { createRoot } from 'react-dom/client'
import App from './App.js'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { CreditsProvider } from './context/CreditsContext'


const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

createRoot(document.getElementById('root')!).render(
  <ClerkProvider
    publishableKey={PUBLISHABLE_KEY}
  signInUrl="/sign-in"
  signUpUrl="/sign-up"
  afterSignInUrl="/"
  afterSignUpUrl="/"
    appearance={{
  variables: {
  colorPrimary: '#db2777',  // ← rose plus foncé comme bg-pink-600
  colorBackground: '#0a0a14',
  colorInputBackground: 'rgba(255,255,255,0.05)',
  colorInputText: 'white',
  colorText: 'white',
  colorTextSecondary: 'rgba(156,163,175,1)',
  borderRadius: '8px',  // ← plus raisonnable pour tout
  fontFamily: 'inherit',
},
  layout: {
    socialButtonsPlacement: 'top',
    showOptionalFields: false,
  },
  elements: {
    // Carte principale — fond sombre avec bordure comme ton ancien login
    rootBox: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    card: {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '16px',  // ← pas 9999px pour la carte !
  boxShadow: 'none',
  padding: '32px',
  width: '100%',
  maxWidth: '380px',
},
    // Header
    headerTitle: {
      color: 'white',
      fontSize: '28px',
      fontWeight: '500',
    },
    headerSubtitle: {
      color: 'rgba(156,163,175,1)',
      fontSize: '14px',
    },
    // Inputs — comme ton ancien login avec ring blanc
    formFieldInput: {
      background: 'rgba(255,255,255,0.05)',
      border: '2px solid rgba(255,255,255,0.10)',
      borderRadius: '9999px',
      color: 'white',
      height: '48px',
      paddingLeft: '24px',
      fontSize: '14px',
      outline: 'none',
    },
    formFieldLabel: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: '13px',
    },
    // Bouton principal — rose comme ton ancien bouton
    formButtonPrimary: {
      background: '#db2777',
      borderRadius: '9999px',
      height: '44px',
      fontSize: '15px',
      fontWeight: '500',
      border: 'none',
      transition: 'background 0.2s',
    },
    // Bouton Google
    socialButtonsBlockButton: {
      background: 'rgba(255,255,255,0.05)',
      border: '2px solid rgba(255,255,255,0.10)',
      borderRadius: '9999px',
      color: 'white',
      height: '44px',
    },
    socialButtonsBlockButtonText: {
      color: 'white',
    },
    // Divider "or"
    dividerLine: {
      background: 'rgba(255,255,255,0.10)',
    },
    dividerText: {
      color: 'rgba(156,163,175,1)',
    },
    // Lien "Sign up" en rose
    footerActionLink: {
      color: '#ec4899',
    },
    footerActionText: {
      color: 'rgba(156,163,175,1)',
    },
    // Footer "Secured by Clerk"
    footer: {
      background: 'transparent',
    },
    identityPreviewText: {
      color: 'white',
    },
    formResendCodeLink: {
      color: '#ec4899',
    },
    // UserButton dropdown
userButtonPopoverCard: {
  background: '#1e1b2e',
  border: '1px solid rgba(255,255,255,0.10)',
},
userButtonPopoverActionButton: {
  color: 'white',
},
userButtonPopoverActionButtonText: {
  color: 'white',
},
userButtonPopoverActionButtonIcon: {
  color: 'white',
},
userPreviewMainIdentifier: {
  color: 'white',
},
userPreviewSecondaryIdentifier: {
  color: 'rgba(156,163,175,1)',
},
userButtonPopoverActionButton__manageAccount: {
  '&:hover': { background: 'rgba(236,72,153,0.15)' },
},
userButtonPopoverActionButton__signOut: {
  '&:hover': { background: 'rgba(236,72,153,0.15)' },
},

  }
}}
    
  >
    <BrowserRouter>
    <CreditsProvider>
      <App />
      </CreditsProvider>
    </BrowserRouter>
  </ClerkProvider>
)