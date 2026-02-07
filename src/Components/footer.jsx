import React from 'react'
import { Terminal, Github, Twitter, Linkedin } from 'lucide-react'
import { motion } from 'framer-motion'

const Footer = () => {
    return (
        <footer className="relative py-12 px-4 border-t border-white/10 bg-black/20">
            <div className="max-w-7xl mx-auto">
                {/* Main Footer Grid */}
                <div className="grid md:grid-cols-3 gap-12 mb-8 items-center">
                    {/* Left - Brand & Copyright */}
                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start space-x-3 mb-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                                <Terminal className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                CodeSync
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                            Real-time collaborative coding made simple.
                        </p>
                        <p className="text-gray-600 text-xs mt-2">
                            © 2026 CodeSync. All rights reserved.
                        </p>
                    </div>

                    {/* Center - Navigation Links */}
                    <div className="flex flex-col items-center space-y-3">
                        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
                            <a href="#home" className="text-gray-400 hover:text-white transition-colors">
                                Home
                            </a>
                            <a href="#features" className="text-gray-400 hover:text-white transition-colors">
                                Features
                            </a>
                            <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">
                                About
                            </a>
                            <a href="#contact" className="text-gray-400 hover:text-white transition-colors">
                                Contact
                            </a>
                        </div>
                        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
                            <button className="text-gray-500 hover:text-gray-300 transition-colors">
                                Privacy Policy
                            </button>
                            <span className="text-gray-700">•</span>
                            <button className="text-gray-500 hover:text-gray-300 transition-colors">
                                Terms of Service
                            </button>
                        </div>
                    </div>

                    {/* Right - Social Links */}
                    <div className="flex flex-col items-center md:items-end space-y-3">
                        <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">
                            Connect With Us
                        </p>
                        <div className="flex items-center space-x-3">
                            <motion.a
                                whileHover={{ y: -3 }}
                                whileTap={{ scale: 0.95 }}
                                href="https://github.com/bhavneetv/codesync"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center transition-all group"
                            >
                                <Github className="w-4.5 h-4.5 text-gray-400 group-hover:text-white transition-colors" />
                            </motion.a>
                          
                            <motion.a
                                whileHover={{ y: -3 }}
                                whileTap={{ scale: 0.95 }}
                                href="https://linkedin.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center transition-all group"
                            >
                                <Linkedin className="w-4.5 h-4.5 text-gray-400 group-hover:text-white transition-colors" />
                            </motion.a>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="pt-8 border-t border-white/5">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-gray-600 text-center md:text-left">
                            Built with <span className="text-blue-400">Vite</span>, <span className="text-cyan-400">Tailwind CSS</span>, and <span className="text-purple-400">Framer Motion</span>
                        </p>
                        <p className="text-xs text-gray-600">
                            Made with ❤️ for developers worldwide
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer