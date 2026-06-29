export default function Footer() {
  return (
    <footer className="relative z-10 bg-black text-white py-12">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 px-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Grapholyze</h3>
          <p className="text-gray-400">Platform AI terdepan untuk analisis tulisan tangan dan kepribadian.</p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Menu</h3>
          <ul className="space-y-2 text-gray-400">
            <li>Handwriting Analysis</li>
            <li>Personality Report</li>
            <li>API Integration</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Kontak</h3>
          <ul className="space-y-2 text-gray-400">
            <li>grapholyze.ai@gmail.com</li>
            <li>+62 812 3456 7890</li>
          </ul>
        </div>
      </div>

      <div className="text-center text-gray-500 mt-12 border-t border-gray-700 pt-6">© 2026 Grapholyze. All rights reserved.</div>
    </footer>
  );
}
