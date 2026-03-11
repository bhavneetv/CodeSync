 import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Download, Monitor, Smartphone, CheckCircle, ExternalLink,
    FileArchive, FolderOpen, Play, Shield, Github, HardDrive,
    AlertCircle, ChevronRight, Lock, Unlock, ArrowRight, Zap
} from 'lucide-react';
import Navbar from './Components/navbar';
import Footer from './Components/footer';


//FOOTER 

const DownloadPage = () => {
    const [selectedOS, setSelectedOS] = useState('windows');

    // Download links configuration
    const downloadLinks = {
        windows: {
            drive: 'https://drive.google.com/your-windows-download-link',
            github: 'https://github.com/bhavneetv/code-sync-flutter/releases/latest'
        },
        android: {
            drive: 'https://drive.google.com/your-android-download-link',
            github: 'https://github.com/bhavneetv/code-sync-flutter/releases/latest'
        },
        ios: {
            drive: 'https://drive.google.com/your-ios-download-link',
            github: 'https://github.com/bhavneetv/code-sync-flutter/releases/latest'
        },
        macos: {
            drive: '#',
            github: '#'
        }
    };

    // OS Platform Data
    const platforms = [
        {
            id: 'windows',
            name: 'Windows',
            icon: <Monitor className="w-6 h-6" />,
            gradient: 'from-blue-500 to-cyan-500',
            available: true
        },
        {
            id: 'macos',
            name: 'macOS',
            icon: <Monitor className="w-6 h-6" />,
            gradient: 'from-gray-500 to-gray-700',
            available: false
        },
        {
            id: 'android',
            name: 'Android',
            icon: <Smartphone className="w-6 h-6" />,
            gradient: 'from-green-500 to-emerald-600',
            available: true
        },
        {
            id: 'ios',
            name: 'iOS',
            icon: <Smartphone className="w-6 h-6" />,
            gradient: 'from-blue-400 to-blue-600',
            available: true
        }
    ];

    // Installation steps for each platform
    const installationSteps = {
        windows: [
            {
                number: 1,
                title: 'Download the installer',
                description: 'Click on either Google Drive or GitHub to download the .exe file',
                icon: <Download className="w-5 h-5" />
            },
            {
                number: 2,
                title: 'Extract the ZIP file',
                description: 'Right-click the downloaded ZIP file and select "Extract All"',
                icon: <FileArchive className="w-5 h-5" />
            },
            {
                number: 3,
                title: 'Run the executable',
                description: 'Double-click the CodeSync.exe file to launch the application',
                icon: <Play className="w-5 h-5" />
            },
            {
                number: 4,
                title: 'Enjoy coding!',
                description: 'The app is now installed and ready to use',
                icon: <CheckCircle className="w-5 h-5" />
            }
        ],
        android: [
            {
                number: 1,
                title: 'Download the APK',
                description: 'Download the .apk file from Google Drive or GitHub',
                icon: <Download className="w-5 h-5" />
            },
            {
                number: 2,
                title: 'Enable installation',
                description: 'Go to Settings > Security > Enable "Unknown Sources" if needed',
                icon: <Shield className="w-5 h-5" />
            },
            {
                number: 3,
                title: 'Install the app',
                description: 'Open the downloaded APK file and tap "Install"',
                icon: <Play className="w-5 h-5" />
            },
            {
                number: 4,
                title: 'Launch and code!',
                description: 'Open CodeSync from your app drawer',
                icon: <CheckCircle className="w-5 h-5" />
            }
        ],
        ios: [
            {
                number: 1,
                title: 'Download the IPA file',
                description: 'Download the .ipa file from Google Drive or GitHub',
                icon: <Download className="w-5 h-5" />
            },
            {
                number: 2,
                title: 'Install AltStore',
                description: 'Download and set up AltStore or Sideloadly on your computer',
                icon: <ExternalLink className="w-5 h-5" />,
                link: 'https://altstore.io',
                linkText: 'Get AltStore'
            },
            {
                number: 3,
                title: 'Sideload the app',
                description: 'Use AltStore or Sideloadly to install the IPA file on your device',
                icon: <Smartphone className="w-5 h-5" />
            },
            {
                number: 4,
                title: 'Trust the certificate',
                description: 'Go to Settings > General > VPN & Device Management and trust the app',
                icon: <CheckCircle className="w-5 h-5" />
            }
        ],
        macos: []
    };

    const DownloadButton = ({ platform, source, icon }) => {
        const isComingSoon = !platforms.find(p => p.id === platform)?.available;

        return (
            <motion.a
                href={isComingSoon ? '#' : downloadLinks[platform][source]}
                target={isComingSoon ? '_self' : '_blank'}
                rel="noopener noreferrer"
                whileHover={isComingSoon ? {} : { scale: 1.05, y: -2 }}
                whileTap={isComingSoon ? {} : { scale: 0.98 }}
                className={`flex items-center justify-center space-x-3 px-6 py-4 rounded-xl font-semibold text-base transition-all ${isComingSoon
                        ? 'bg-gray-800/50 border border-gray-700 text-gray-500 cursor-not-allowed'
                        : source === 'drive'
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30'
                    }`}
            >
                {icon}
                <span>{source === 'drive' ? 'Google Drive' : 'GitHub Release'}</span>
                {!isComingSoon && <ExternalLink className="w-4 h-4" />}
            </motion.a>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { 
          font-family: 'Inter', sans-serif;
        }
        
        html {
          scroll-behavior: smooth;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #06b6d4);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #0891b2);
        }
      `}</style>

            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.03, 0.05, 0.03]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/4 -left-48 w-96 h-96 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [90, 0, 90],
                        opacity: [0.03, 0.05, 0.03]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-1/4 -right-48 w-96 h-96 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl"
                />
            </div>

            {/* Navbar */}
            <Navbar />

            {/* Hero Section */}
            <section className="min-h-[40vh] flex items-center justify-center px-4 pt-32 pb-12">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5, type: "spring" }}
                            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/50"
                        >
                            <Download className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                        </motion.div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                            Download CodeSync
                        </h1>
                        <p className="text-base sm:text-lg lg:text-xl text-gray-400 mb-8">
                            Available on Windows, Android, and iOS. Choose your platform below.
                        </p>

                        {/* Security Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="inline-flex items-center space-x-3 backdrop-blur-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-full px-6 py-3"
                        >
                            <Shield className="w-5 h-5 text-emerald-400" />
                            <span className="text-sm text-gray-300">
                                <span className="font-bold text-emerald-400">100% Open Source</span> • Virus Free • Verified
                            </span>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Platform Selector */}
            <section className="py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="backdrop-blur-xl bg-gradient-to-br from-slate-900/60 to-slate-800/60 border border-white/10 rounded-2xl p-2 sm:p-3"
                    >
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            {platforms.map((platform) => (
                                <motion.button
                                    key={platform.id}
                                    onClick={() => setSelectedOS(platform.id)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`relative px-4 py-4 sm:py-5 rounded-xl font-semibold text-sm sm:text-base transition-all ${selectedOS === platform.id
                                            ? `bg-gradient-to-r ${platform.gradient} text-white shadow-lg`
                                            : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex flex-col items-center space-y-2">
                                        {platform.icon}
                                        <span>{platform.name}</span>
                                        {!platform.available && (
                                            <span className="text-xs text-gray-500">Coming Soon</span>
                                        )}
                                    </div>
                                    {selectedOS === platform.id && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className={`absolute inset-0 bg-gradient-to-r ${platform.gradient} rounded-xl -z-10`}
                                        />
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Installation Content */}
            <section className="py-12 px-4">
                <div className="max-w-6xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedOS}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {selectedOS === 'macos' ? (
                                // macOS Coming Soon
                                <div className="backdrop-blur-xl bg-gradient-to-br from-slate-900/60 to-slate-800/60 border border-white/10 rounded-2xl p-8 sm:p-12 text-center">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", duration: 0.5 }}
                                        className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-500 to-gray-700 rounded-2xl flex items-center justify-center"
                                    >
                                        <Monitor className="w-12 h-12 text-white" />
                                    </motion.div>
                                    <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">macOS Version</h2>
                                    <p className="text-xl text-gray-400 mb-6">Coming Soon</p>
                                    <p className="text-gray-500 max-w-md mx-auto">
                                        We're working hard to bring CodeSync to macOS. Stay tuned for updates!
                                    </p>
                                </div>
                            ) : (
                                <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
                                    {/* Download Links Section */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="backdrop-blur-xl bg-gradient-to-br from-slate-900/60 to-slate-800/60 border border-white/10 rounded-2xl p-6 sm:p-8"
                                    >
                                        <div className="flex items-center space-x-3 mb-6">
                                            <div className={`w-12 h-12 bg-gradient-to-br ${platforms.find(p => p.id === selectedOS)?.gradient} rounded-xl flex items-center justify-center`}>
                                                {platforms.find(p => p.id === selectedOS)?.icon}
                                            </div>
                                            <div>
                                                <h3 className="text-xl sm:text-2xl font-bold">Download for {platforms.find(p => p.id === selectedOS)?.name}</h3>
                                                <p className="text-sm text-gray-400">Choose your download source</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <DownloadButton
                                                platform={selectedOS}
                                                source="drive"
                                                icon={<HardDrive className="w-5 h-5" />}
                                            />
                                            <DownloadButton
                                                platform={selectedOS}
                                                source="github"
                                                icon={<Github className="w-5 h-5" />}
                                            />
                                        </div>

                                        {/* Additional Info */}
                                        <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                                            <div className="flex items-start space-x-3 text-sm text-gray-400">
                                                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                                <span>Open source and completely free</span>
                                            </div>
                                            <div className="flex items-start space-x-3 text-sm text-gray-400">
                                                <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                                <span>100% virus-free and safe to install</span>
                                            </div>
                                            <div className="flex items-start space-x-3 text-sm text-gray-400">
                                                <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                                <span>Latest version with all features</span>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Installation Steps Section */}
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="backdrop-blur-xl bg-gradient-to-br from-slate-900/60 to-slate-800/60 border border-white/10 rounded-2xl p-6 sm:p-8"
                                    >
                                        <h3 className="text-xl sm:text-2xl font-bold mb-6 flex items-center">
                                            <FolderOpen className="w-6 h-6 mr-3 text-cyan-400" />
                                            Installation Steps
                                        </h3>

                                        <div className="space-y-4">
                                            {installationSteps[selectedOS].map((step, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className="flex items-start space-x-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
                                                >
                                                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${platforms.find(p => p.id === selectedOS)?.gradient} flex items-center justify-center font-bold text-lg`}>
                                                        {step.number}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-white mb-1 flex items-center">
                                                            {step.title}
                                                            {step.icon && (
                                                                <span className="ml-2 text-gray-400 group-hover:text-white transition-colors">
                                                                    {step.icon}
                                                                </span>
                                                            )}
                                                        </h4>
                                                        <p className="text-sm text-gray-400">{step.description}</p>
                                                        {step.link && (
                                                            <a
                                                                href={step.link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300 mt-2 transition-colors"
                                                            >
                                                                <span>{step.linkText}</span>
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Success Message */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                            className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                                <p className="text-sm text-gray-300">
                                                    That's it! You're ready to start coding with CodeSync.
                                                </p>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </section>

            {/* System Requirements */}
            <section className="py-12 px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-8"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            System Requirements
                        </h2>
                        <p className="text-gray-400">Make sure your system meets these requirements</p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Windows Requirements */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="backdrop-blur-xl bg-gradient-to-br from-slate-900/60 to-slate-800/60 border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all"
                        >
                            <div className="flex items-center space-x-3 mb-4">
                                <Monitor className="w-6 h-6 text-blue-400" />
                                <h3 className="text-lg font-semibold">Windows</h3>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li className="flex items-start">
                                    <ChevronRight className="w-4 h-4 mr-2 mt-0.5 text-blue-400 flex-shrink-0" />
                                    Windows 10 or later
                                </li>
                                <li className="flex items-start">
                                    <ChevronRight className="w-4 h-4 mr-2 mt-0.5 text-blue-400 flex-shrink-0" />
                                    4GB RAM minimum
                                </li>
                                <li className="flex items-start">
                                    <ChevronRight className="w-4 h-4 mr-2 mt-0.5 text-blue-400 flex-shrink-0" />
                                    200MB free disk space
                                </li>
                            </ul>
                        </motion.div>

                        {/* Android Requirements */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="backdrop-blur-xl bg-gradient-to-br from-slate-900/60 to-slate-800/60 border border-white/10 rounded-2xl p-6 hover:border-green-500/30 transition-all"
                        >
                            <div className="flex items-center space-x-3 mb-4">
                                <Smartphone className="w-6 h-6 text-green-400" />
                                <h3 className="text-lg font-semibold">Android</h3>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li className="flex items-start">
                                    <ChevronRight className="w-4 h-4 mr-2 mt-0.5 text-green-400 flex-shrink-0" />
                                    Android 8.0 or later
                                </li>
                                <li className="flex items-start">
                                    <ChevronRight className="w-4 h-4 mr-2 mt-0.5 text-green-400 flex-shrink-0" />
                                    2GB RAM minimum
                                </li>
                                <li className="flex items-start">
                                    <ChevronRight className="w-4 h-4 mr-2 mt-0.5 text-green-400 flex-shrink-0" />
                                    100MB free storage
                                </li>
                            </ul>
                        </motion.div>

                        {/* iOS Requirements */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="backdrop-blur-xl bg-gradient-to-br from-slate-900/60 to-slate-800/60 border border-white/10 rounded-2xl p-6 hover:border-blue-400/30 transition-all sm:col-span-2 lg:col-span-1"
                        >
                            <div className="flex items-center space-x-3 mb-4">
                                <Smartphone className="w-6 h-6 text-blue-400" />
                                <h3 className="text-lg font-semibold">iOS</h3>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li className="flex items-start">
                                    <ChevronRight className="w-4 h-4 mr-2 mt-0.5 text-blue-400 flex-shrink-0" />
                                    iOS 14.0 or later
                                </li>
                                <li className="flex items-start">
                                    <ChevronRight className="w-4 h-4 mr-2 mt-0.5 text-blue-400 flex-shrink-0" />
                                    Compatible with iPhone & iPad
                                </li>
                                <li className="flex items-start">
                                    <ChevronRight className="w-4 h-4 mr-2 mt-0.5 text-blue-400 flex-shrink-0" />
                                    100MB free storage
                                </li>
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-12 px-4 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-8"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                            Frequently Asked Questions
                        </h2>
                    </motion.div>

                    <div className="space-y-4">
                        {[
                            {
                                q: 'Is CodeSync really free?',
                                a: 'Yes! CodeSync is completely free and open source. No hidden fees, no premium tiers.',
                                icon: <Unlock className="w-5 h-5 text-emerald-400" />
                            },
                            {
                                q: 'Is it safe to download?',
                                a: 'Absolutely. All our releases are open source and verified. You can check the source code on GitHub.',
                                icon: <Shield className="w-5 h-5 text-blue-400" />
                            },
                            {
                                q: 'Do I need an account to use CodeSync?',
                                a: 'No account needed for temporary rooms! Create an account to save your rooms permanently.',
                                icon: <AlertCircle className="w-5 h-5 text-yellow-400" />
                            },
                            {
                                q: 'Can I use it offline?',
                                a: 'The desktop and mobile apps work offline for local coding. Real-time collaboration requires internet.',
                                icon: <Monitor className="w-5 h-5 text-purple-400" />
                            }
                        ].map((faq, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="backdrop-blur-xl bg-gradient-to-br from-slate-900/60 to-slate-800/60 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all"
                            >
                                <div className="flex items-start space-x-3">
                                    {faq.icon}
                                    <div>
                                        <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                                        <p className="text-sm text-gray-400">{faq.a}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-12 px-4 mb-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto text-center backdrop-blur-xl bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-emerald-500/10 border border-blue-500/20 rounded-3xl p-8 sm:p-12 relative overflow-hidden"
                >
                    <motion.div
                        animate={{
                            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        }}
                        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-emerald-500/5 bg-[length:200%_100%]"
                    />

                    <div className="relative">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Need Help?</h2>
                        <p className="text-gray-400 mb-6">
                            Check out our documentation or join our community for support
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-semibold flex items-center justify-center space-x-2"
                            >
                                <span>Documentation</span>
                                <ArrowRight className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold flex items-center justify-center space-x-2"
                            >
                                <Github className="w-4 h-4" />
                                <span>View on GitHub</span>
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default DownloadPage;
