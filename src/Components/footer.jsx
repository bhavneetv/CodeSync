import React from 'react'
import { Terminal, Github, Twitter, Linkedin } from 'lucide-react'
import { motion } from 'framer-motion'

const Footer = () => {
    return (
        <footer className="py-8 px-4 border-t border-white/10 bg-black/30">
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-3 gap-8 mb-6">
                    {/* Left - Copyright */}
                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                <Terminal className="w-4 h-4 text-white" strokeWidth={2.5} />
                            </div>
                            <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                CodeSync
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm">© 2026 CodeSync. All rights reserved.</p>
                    </div>

                    {/* Center - Links */}
                    <div className="flex justify-center items-center space-x-6 text-sm">
                        <button className="text-gray-400 hover:text-white transition-colors">Privacy</button>
                        <span className="text-gray-600">•</span>
                        <button className="text-gray-400 hover:text-white transition-colors">Terms</button>
                        <span className="text-gray-600">•</span>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors flex items-center space-x-1">
                            <Github className="w-4 h-4" />
                            <span>GitHub</span>
                        </a>
                    </div>

                    {/* Right - Social Icons */}
                    <div className="flex justify-center md:justify-end items-center space-x-4">
                        <motion.a
                            whileHover={{ scale: 1.1, y: -2 }}
                            href="#"
                            className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center transition-all"
                        >
                            <Github className="w-5 h-5 text-gray-400" />
                        </motion.a>
                        <motion.a
                            whileHover={{ scale: 1.1, y: -2 }}
                            href="#"
                            className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center transition-all"
                        >
                            <Twitter className="w-5 h-5 text-gray-400" />
                        </motion.a>
                        <motion.a
                            whileHover={{ scale: 1.1, y: -2 }}
                            href="#"
                            className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center transition-all"
                        >
                            <Linkedin className="w-5 h-5 text-gray-400" />
                        </motion.a>
                    </div>
                </div>

                {/* Bottom text */}
                <div className="text-center pt-6 border-t border-white/5">
                    <p className="text-xs text-gray-600">
                        Built with React, Tailwind CSS, and Framer Motion
                    </p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
