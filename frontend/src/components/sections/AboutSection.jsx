"use client";

import { Brain, Cpu, Code2, Network, Activity, Globe2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AboutSection() {
  const team = [
    { name: "Rhena Tabella", role: "Rekayasa Perangkat Lunak", img: "/team/rhena.jpeg" },
    { name: "Jovita Amanda", role: "Rekayasa Perangkat Lunak", img: "/team/jovita.jpeg" },
    { name: "Putri Syabilah", role: "Sistem Cerdas", img: "/team/putri.jpeg" },
    { name: "Aisyah Nurfadilah", role: "Data Processing", img: "/team/aisyah.jpeg" },
  ];

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.1 } },
  };

  return (
    <section className="relative overflow-hidden">

      {/* ABOUT GRAPHOLYZE */}
      <div className="bg-white/80 backdrop-blur-sm text-gray-800 py-14 px-4 sm:px-6 md:py-20">
        <div className="max-w-6xl mx-auto">

          {/* Tentang */}
          <div className="mb-16 md:mb-24">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-indigo-900 mb-6 md:mb-8 flex items-center gap-3"
            >
              <Activity className="text-pink-500 shrink-0" />
              Tentang Grapholyze
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                <motion.p variants={fadeInUp} className="text-base md:text-lg text-gray-700 mb-4 md:mb-6">
                  Grapholyze adalah platform inovatif yang menggabungkan ilmu grafologi tradisional dengan teknologi AI modern untuk memberikan analisis kepribadian melalui tulisan tangan.
                </motion.p>
                <motion.p variants={fadeInUp} className="text-base md:text-lg text-gray-700 mb-6 md:mb-8">
                  Kami percaya setiap orang berhak memahami diri mereka lebih dalam dengan bantuan teknologi.
                </motion.p>

                {/* Stats */}
                <motion.div
                  variants={fadeInUp}
                  className="flex gap-4 md:gap-8 bg-gray-50 p-4 md:p-6 rounded-2xl border shadow-sm"
                >
                  <div>
                    <h4 className="text-2xl md:text-4xl font-black text-indigo-600">95%</h4>
                    <p className="text-xs md:text-sm text-gray-500">Akurasi</p>
                  </div>
                  <div className="w-px bg-gray-200" />
                  <div>
                    <h4 className="text-2xl md:text-4xl font-black text-indigo-600">24/7</h4>
                    <p className="text-xs md:text-sm text-gray-500">Online</p>
                  </div>
                  <div className="w-px bg-gray-200" />
                  <div>
                    <h4 className="text-2xl md:text-4xl font-black text-indigo-600">1k+</h4>
                    <p className="text-xs md:text-sm text-gray-500">Analisis</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Quote card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 border rounded-3xl p-6 md:p-10 shadow-lg"
              >
                <p className="italic text-base md:text-xl text-gray-700">
                  "Grapholyze hadir untuk menjembatani grafologi tradisional dan AI modern agar analisis kepribadian lebih mudah dan akurat."
                </p>
              </motion.div>
            </div>
          </div>

          {/* TEAM SECTION */}
          <div className="mb-16 md:mb-24 py-12 md:py-16 border-t">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12"
            >
              Tim Grapholyze
            </motion.h2>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10"
            >
              {team.map((person, i) => (
                <motion.div key={i} variants={fadeInUp} className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-xl mb-3 md:mb-4">
                    <img
                      src={person.img}
                      alt={person.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = "/profile.jpeg"; }}
                    />
                  </div>
                  <h4 className="text-sm sm:text-base md:text-xl font-bold">{person.name}</h4>
                  <p className="text-xs sm:text-sm md:text-base text-indigo-600">{person.role}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* TECHNOLOGY */}
          <div className="py-12 md:py-16">
            <motion.h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12">
              Teknologi Kami
            </motion.h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {[
                { title: "Computer Vision", icon: <Cpu size={28} /> },
                { title: "Deep Learning", icon: <Brain size={28} /> },
                { title: "Software Engineering", icon: <Code2 size={28} /> },
                { title: "Machine Learning", icon: <Network size={28} /> },
              ].map((t, i) => (
                <div key={i} className="flex flex-col items-center p-4 md:p-6 bg-white rounded-2xl shadow">
                  {t.icon}
                  <h4 className="mt-3 font-bold text-xs sm:text-sm md:text-base text-center">{t.title}</h4>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* VISI MISI */}
      <section className="bg-gradient-to-b from-slate-900 to-indigo-950 py-16 px-4 sm:px-6 md:py-24 text-white">
        <div className="max-w-6xl mx-auto">
          <motion.h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 md:mb-16">
            Visi & Misi
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
            <div className="bg-white/10 p-6 md:p-10 rounded-3xl">
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 flex items-center gap-3">
                <Globe2 className="shrink-0" /> Visi
              </h3>
              <p className="text-sm md:text-base">
                Menjadi platform grafologi berbasis AI terdepan yang mudah diakses semua orang.
              </p>
            </div>

            <div className="bg-white/10 p-6 md:p-10 rounded-3xl">
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 flex items-center gap-3">
                <Activity className="shrink-0" /> Misi
              </h3>
              <ul className="space-y-2 text-sm md:text-base">
                <li>✓ Integrasi grafologi & AI</li>
                <li>✓ Analisis akurat & actionable</li>
                <li>✓ Meningkatkan self-awareness</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

    </section>
  );
}