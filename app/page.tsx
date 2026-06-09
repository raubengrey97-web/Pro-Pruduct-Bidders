export default function Home() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Pro Product Bidders</h1>
      <p><a href="/signup">Sign Up</a> | <a href="/login">Login</a></p>
      
      <div className="mt-8 bg-green-50 border-green-200 rounded-xl p-4 flex items-center justify-between gap-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="text-2xl">📱</div>
          <div>
            <p className="font-semibold text-green-900">Get Live Auction Updates</p>
            <p className="text-sm text-green-700">Join our WhatsApp Channel for instant bid alerts</p>
          </div>
        </div>
        <a 
          href="https://whatsapp.com/channel/0029Vb8BJy53QxRvKOadak0O" 
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium whitespace-nowrap transition-colors"
        >
          Join Channel
        </a>
      </div>
    </main>
  )
}
