export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm">
            © {new Date().getFullYear()} Business Listing Admin. All rights reserved.
          </p>
          <p className="text-sm mt-2 md:mt-0">
            Powered by True Products Network
          </p>
        </div>
      </div>
    </footer>
  )
}
