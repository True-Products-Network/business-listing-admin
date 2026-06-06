import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Building2, Shield, FileText, CheckCircle, ExternalLink } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/images/logo.svg" alt="Business Directory" className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://stlbusinessguide.com/" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="hidden sm:flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Claim Your Business
              </Button>
            </a>
            <Link href="/submit">
              <Button variant="outline" className="sm:hidden">Submit</Button>
              <Button variant="outline" className="hidden sm:flex">Submit Listing</Button>
            </Link>
            <Link href="/login">
              <Button>Admin Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Connect With Local Businesses
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Discover and connect with trusted businesses in your area. 
            List your business to reach more customers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/submit">
              <Button size="lg" className="w-full sm:w-auto">
                <FileText className="h-5 w-5 mr-2" />
                List Your Business
              </Button>
            </Link>
            <Link href="/directory">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Building2 className="h-5 w-5 mr-2" />
                Browse Directory
              </Button>
            </Link>
            <a 
              href="https://stlbusinessguide.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                <ExternalLink className="h-5 w-5 mr-2" />
                Claim Your Business
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Submit Your Listing</CardTitle>
                <CardDescription>
                  Fill out our simple form with your business details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Provide your business information, contact details, and description. 
                  It only takes a few minutes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle>We Review & Approve</CardTitle>
                <CardDescription>
                  Our team reviews every submission for quality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  We verify your business information to ensure accuracy 
                  and maintain directory quality.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <CardTitle>Get Discovered</CardTitle>
                <CardDescription>
                  Your listing goes live and reaches potential customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Once approved, your business appears in our directory 
                  where customers can find you.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to Get Listed?
          </h2>
          <p className="text-slate-600 mb-8">
            Join hundreds of businesses already in our directory
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/submit">
              <Button size="lg">
                Submit Your Business Today
              </Button>
            </Link>
            <a 
              href="https://stlbusinessguide.com/" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline">
                <ExternalLink className="h-5 w-5 mr-2" />
                Claim Your Business
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/images/logo.svg" alt="Business Directory" className="h-6 w-auto" />
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} Business Directory. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
