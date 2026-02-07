import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Terminal, Home, Zap, Info, Mail, LogIn, LogOut, Menu, X } from 'lucide-react';
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
                    className="relative w-full"
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
                        <div className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex justify-between items-center">
                                {/* Left Side - Logo */}
                                <motion.div
                                    animate={{
                                        scale: isCompact ? 0.92 : 1,
                                    }}
                                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                                    className="flex items-center space-x-2 md:space-x-4 cursor-pointer"
                                    onClick={() => {
                                        window.location.href = '/';
                                    }}
                                >
                                    <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                                        <Terminal className="w-4 h-4 text-white" strokeWidth={2.5} />
                                    </div>
                                    <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap">
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

                                {/* Right Side - Desktop Navigation */}
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

                                    {/* Enhanced Login/Logout Button */}
                                    <button
                                        onClick={handleAuthButtonClick}
                                        className={`flex items-center space-x-2 px-5 py-2 rounded-lg font-medium transition-all duration-200 shadow-md
                                            ${Logined
                                                ? "bg-red-500 text-white hover:bg-red-600 hover:shadow-red-500/50"
                                                : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 hover:shadow-blue-500/50"
                                            }
                                        `}
                                    >
                                        {Logined ? (
                                            <>
                                                <LogOut className="w-4 h-4" />
                                                <span>Logout</span>
                                            </>
                                        ) : (
                                            <>
                                                <LogIn className="w-4 h-4" />
                                                <span>Login</span>
                                            </>
                                        )}
                                    </button>
                                </motion.div>

                                {/* Mobile Menu Button */}
                                <motion.button
                                    animate={{
                                        opacity: isCompact ? 0 : 1,
                                        pointerEvents: isCompact ? 'none' : 'auto',
                                    }}
                                    transition={{ duration: 0.9 }}
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
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
                    className="fixed inset-0 z-40 md:hidden bg-black/95 backdrop-blur-2xl pt-24"
                >
                    <div className="flex flex-col items-center space-y-8 p-8">
                        <a 
                            href="#home" 
                            onClick={() => setMobileMenuOpen(false)} 
                            className="text-xl text-gray-300 hover:text-white transition-colors py-3 flex items-center space-x-3 w-full max-w-xs justify-center hover:bg-white/5 rounded-lg"
                        >
                            <Home className="w-5 h-5" />
                            <span>Home</span>
                        </a>
                        <a 
                            href="#features" 
                            onClick={() => setMobileMenuOpen(false)} 
                            className="text-xl text-gray-300 hover:text-white transition-colors py-3 flex items-center space-x-3 w-full max-w-xs justify-center hover:bg-white/5 rounded-lg"
                        >
                            <Zap className="w-5 h-5" />
                            <span>Features</span>
                        </a>
                        <a 
                            href="#how-it-works" 
                            onClick={() => setMobileMenuOpen(false)} 
                            className="text-xl text-gray-300 hover:text-white transition-colors py-3 flex items-center space-x-3 w-full max-w-xs justify-center hover:bg-white/5 rounded-lg"
                        >
                            <Info className="w-5 h-5" />
                            <span>About</span>
                        </a>
                        <a 
                            href="#contact" 
                            onClick={() => setMobileMenuOpen(false)} 
                            className="text-xl text-gray-300 hover:text-white transition-colors py-3 flex items-center space-x-3 w-full max-w-xs justify-center hover:bg-white/5 rounded-lg"
                        >
                            <Mail className="w-5 h-5" />
                            <span>Contact</span>
                        </a>
                        
                        {/* Mobile Login/Logout Button */}
                        <button 
                            onClick={() => {
                                handleAuthButtonClick();
                                setMobileMenuOpen(false);
                            }}
                            className={`flex items-center space-x-3 text-lg px-10 py-4 rounded-full font-semibold shadow-xl mt-6 transition-all duration-200 w-full max-w-xs justify-center
                                ${Logined
                                    ? "bg-red-500 text-white hover:bg-red-600 shadow-red-500/50"
                                    : "bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-blue-500/50"
                                }
                            `}
                        >
                            {Logined ? (
                                <>
                                    <LogOut className="w-5 h-5" />
                                    <span>Logout</span>
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    <span>Login</span>
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            )}
        </>
    );
}