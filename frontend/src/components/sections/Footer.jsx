export default function Footer() {
  return (
    <footer className="relative z-10 bg-black text-white py-10 md:py-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10 px-4 sm:px-6">
        <div>
          <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Grapholyze</h3>
          <p className="text-gray-400 text-sm md:text-base">Platform AI terdepan untuk analisis tulisan tangan dan kepribadian.</p>
        </div>

        <div>
          <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Menu</h3>
          <ul className="space-y-2 text-gray-400 text-sm md:text-base">
            <li>Handwriting Analysis</li>
            <li>Personality Report</li>
            <li>API Integration</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Kontak</h3>
          <ul className="space-y-2 text-gray-400 text-sm md:text-base">
            <li>grapholyze.ai@gmail.com</li>
            <li>-</li>
          </ul>
        </div>
      </div>

      <div className="text-center text-gray-500 text-xs md:text-sm mt-10 md:mt-12 border-t border-gray-700 pt-6 px-4">© 2026 Grapholyze. All rights reserved.</div>
    </footer>
  );
}
