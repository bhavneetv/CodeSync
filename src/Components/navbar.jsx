import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useEffect, use } from 'react';
import { Terminal, Home, Zap, Info, Mail, LogIn, Menu, X } from 'lucide-react';
import { s } from 'framer-motion/client';
import { isLoggin } from '../function/login/isLoggin';
import { logout } from '../function/login/auth';

export default function Navbar(props) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrollDirection, setScrollDirection] = useState('up');
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isCompact, setIsCompact] = useState(false);
    const [Logined, setLogined] = useState(false);


    // Check login status on mount
    useEffect(() => {
        (async () => {
            const loggedIn = await isLoggin();
            if (loggedIn) {
                setLogined(true);
            }
        })();
    }, []);
    const handleAuthButtonClick = async () => {
        if (Logined) {
            await logout();
            setLogined(false);
        } else {
            window.location.href = '/login';
        }
    };






    const setThrueshold = () => {
        if (props?.path?.startsWith("/create-room")) {

            return 10000;
        }
        return 50;

    }
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY < setThrueshold()) {
                setIsCompact(false);
                setScrollDirection('up');
            } else {

                if (currentScrollY > lastScrollY) {

                    setScrollDirection('down');
                    setIsCompact(true);
                } else if (currentScrollY < lastScrollY) {
                    setScrollDirection('up');
                    setIsCompact(false);
                }
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return (
        <>
            {/* Navbar Container */}
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-2"
            >
                <motion.div
                    animate={{
                        width: isCompact ? '190px' : '70%',
                        maxWidth: isCompact ? '190px' : '900px',
                    }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    className="relative"
                >
                    {/* Glassmorphism Background */}
                    <motion.div
                        animate={{
                            borderRadius: isCompact ? '9999px' : '12px',
                        }}
                        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                        className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden"
                        style={{
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                        }}
                    >
                        <div className="px-6 sm:px-6 py-5 ">
                            <div className="flex justify-between items-center ">
                                {/* Left Side - Logo */}
                                <motion.div
                                    animate={{
                                        scale: isCompact ? 0.92 : 1,
                                    }}
                                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                                    className="flex items-center space-x-2 md:space-x-4  " onClick={() => {
                                        window.location.href = '/';
                                    }} style={{ cursor: 'pointer' }}
                                >
                                    <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                                        <Terminal className="w-4 h-4 text-white" strokeWidth={2.5} />
                                    </div>
                                    <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap">
                                        CodeSync
                                    </span>
                                </motion.div>

                                {/* Center - Hidden when compact */}
                                <motion.div
                                    animate={{
                                        opacity: isCompact ? 0 : 1,
                                        scale: isCompact ? 0.9 : 1,
                                        pointerEvents: isCompact ? 'none' : 'auto',
                                    }}
                                    transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
                                    className="hidden md:flex items-center space-x-6"
                                >

                                </motion.div>

                                {/* Right Side - About, Contact + Login */}
                                <motion.div
                                    animate={{
                                        opacity: isCompact ? 0 : 1,
                                        scale: isCompact ? 0.9 : 1,
                                        pointerEvents: isCompact ? 'none' : 'auto',
                                    }}
                                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                    className="hidden md:flex items-center space-x-5"

                                >
                                    <a href="#home" className="flex items-center space-x-1.5 text-gray-300 hover:text-white transition-colors text-sm font-medium">
                                        <Home className="w-3.5 h-3.5" />
                                        <span>Home</span>
                                    </a>
                                    <a href="#features" className="flex items-center space-x-1.5 text-gray-300 hover:text-white transition-colors text-sm font-medium">
                                        <Zap className="w-3.5 h-3.5" />
                                        <span>Features</span>
                                    </a>
                                    <a href="#how-it-works" className="flex items-center space-x-1.5 text-gray-300 hover:text-white transition-colors text-sm font-medium">
                                        <Info className="w-3.5 h-3.5" />
                                        <span>About</span>
                                    </a>
                                    <a href="#contact" className="flex items-center space-x-1.5 text-gray-300 hover:text-white transition-colors text-sm font-medium">
                                        <Mail className="w-3.5 h-3.5" />
                                        <span>Contact</span>
                                    </a>

                                    {/* Enhanced Login Button */}
                                    <button
                                        onClick={handleAuthButtonClick}
                                        className={`px-5 py-2 rounded-md font-medium transition-colors cursor-pointer duration-200 
                                                ${Logined
                                                ? "bg-red-500 text-white hover:bg-red-600"
                                                : "bg-white text-black border border-gray-300 hover:bg-gray-100"
                                            }
                                        `}
                                    >
                                        {Logined ? "Logout" : "Login"}
                                    </button>
                                </motion.div>

                                {/* Mobile Menu Button - Hidden when compact */}
                                <motion.button
                                    animate={{
                                        opacity: isCompact ? 0 : 1,
                                        pointerEvents: isCompact ? 'none' : 'auto',
                                    }}
                                    transition={{ duration: 0.9 }}
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </motion.nav>

            {/* Mobile Menu - Full Screen Overlay */}
            {mobileMenuOpen && !isCompact && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-40 md:hidden bg-black/95 backdrop-blur-2xl pt-20"
                >
                    <div className="flex flex-col items-center space-y-6 p-8">
                        <a href="#home" onClick={() => setMobileMenuOpen(false)} className="text-lg text-gray-300 hover:text-white transition-colors py-3 flex items-center space-x-3">
                            <Home className="w-5 h-5" />
                            <span>Home</span>
                        </a>
                        <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg text-gray-300 hover:text-white transition-colors py-3 flex items-center space-x-3">
                            <Zap className="w-5 h-5" />
                            <span>Features</span>
                        </a>
                        <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-lg text-gray-300 hover:text-white transition-colors py-3 flex items-center space-x-3">
                            <Info className="w-5 h-5" />
                            <span>About</span>
                        </a>
                        <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-lg text-gray-300 hover:text-white transition-colors py-3 flex items-center space-x-3">
                            <Mail className="w-5 h-5" />
                            <span>Contact</span>
                        </a>
                        <button className="relative group text-lg bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 px-8 py-3 rounded-full flex items-center space-x-3 shadow-xl shadow-blue-500/60 mt-4 font-semibold overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            <LogIn className="w-5 h-5 relative z-10" />
                            <span className="relative z-10">Login</span>
                        </button>
                    </div>
                </motion.div>
            )}
        </>
    );
}