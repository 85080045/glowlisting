import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'

// 滚动到顶部组件
function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    // 如果没有hash，滚动到顶部
    if (!hash) {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])

  return null
}
import { LanguageProvider } from './contexts/LanguageContext'
import { AuthProvider } from './contexts/AuthContext'
import Header from './components/Header'
import Hero from './components/Hero'
import UploadSection from './components/UploadSection'
import Features from './components/Features'
import DetailedFeatures from './components/DetailedFeatures'
import Benefits from './components/Benefits'
import Testimonials from './components/Testimonials'
import Pricing from './components/Pricing'
import FAQ from './components/FAQ'
import Footer from './components/Footer'
import Login from './components/Login'
import ResetPassword from './components/ResetPassword'
import PaymentSuccess from './components/PaymentSuccess'
import PaymentCancel from './components/PaymentCancel'
import Dashboard from './components/Dashboard'
import AccountSettings from './components/AccountSettings'
import ImageHistory from './components/ImageHistory'
import SubscriptionManagement from './components/SubscriptionManagement'
import AdminDashboard from './components/AdminDashboard'
import AboutUs from './components/AboutUs'
import Blog from './components/Blog'
import Reviews from './components/Reviews'
import PrivacyPolicy from './components/PrivacyPolicy'
import HelpCenter from './components/HelpCenter'
import MediaInquiry from './components/MediaInquiry'
import InvestorRelations from './components/InvestorRelations'

function Home() {
  const [uploadedImage, setUploadedImage] = useState(null)
  const [enhancedImage, setEnhancedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const location = useLocation()

  // 处理从其他页面跳转过来时的 hash 滚动
  useEffect(() => {
    if (location.hash) {
      const hash = location.hash.substring(1) // 去掉 # 号
      const validHashes = ['features', 'detailed-features', 'pricing', 'faq']
      
      if (validHashes.includes(hash)) {
        setTimeout(() => {
          const element = document.getElementById(hash)
          if (element) {
            const headerHeight = 64 // header高度是h-16，即64px
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
            const offsetPosition = elementPosition - headerHeight

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            })
          }
        }, 100)
      }
    }
  }, [location])

  return (
    <>
      <Header />
      <main className="flex-grow">
        <Hero />
        <Features />
        <DetailedFeatures />
        <UploadSection 
          uploadedImage={uploadedImage}
          setUploadedImage={setUploadedImage}
          enhancedImage={enhancedImage}
          setEnhancedImage={setEnhancedImage}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
        />
        <Benefits />
        <Testimonials />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </>
  )
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<AccountSettings />} />
            <Route path="/history" element={<ImageHistory />} />
            <Route path="/subscription" element={<SubscriptionManagement />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancel" element={<PaymentCancel />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:postId" element={<Blog />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/media" element={<MediaInquiry />} />
            <Route path="/investors" element={<InvestorRelations />} />
            <Route path="/pricing" element={
              <>
                <Header />
                <main className="flex-grow">
                  <Pricing />
                </main>
                <Footer />
              </>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App

