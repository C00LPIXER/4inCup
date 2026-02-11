import { Link, useLocation } from 'react-router-dom';
import { Container } from './Container';
import { Trophy, Users, Calendar, Table, Shield, Settings } from 'lucide-react';

export function Layout({ children }) {
    const location = useLocation();
    const bgImage = '/assets/badminton_court_bg.png'; // Will be placed here

    const navItems = [
        { name: 'Home', path: '/', icon: Trophy },
        { name: 'Standings', path: '/standings', icon: Table },
        { name: 'Groups', path: '/groups', icon: Users },
        { name: 'Fixtures', path: '/fixtures', icon: Calendar },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col relative overflow-hidden font-sans">
            {/* Background Overlay */}
            <div
                className="absolute inset-0 z-0 opacity-20 bg-cover bg-center bg-no-repeat pointer-events-none"
                style={{ backgroundImage: `url(${bgImage})` }}
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-neutral-950/80 to-neutral-950 pointer-events-none" />

            {/* Navbar */}
            <nav className="relative z-10 border-b border-white/10 bg-neutral-950/50 backdrop-blur-md sticky top-0">
                <Container>
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-lime-400">
                            <Trophy className="w-6 h-6" />
                            <span>4inCup</span>
                        </Link>

                        <div className="hidden md:flex gap-1">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium
                      ${isActive
                                                ? 'bg-lime-400/10 text-lime-400'
                                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </Container>
            </nav>

            {/* Mobile Nav (Bottom) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-950 border-t border-white/10 pb-safe">
                <div className="flex justify-around items-center h-16">
                    {navItems.slice(0, 5).map((item) => { // Limit items for mobile
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex flex-col items-center justify-center w-full h-full gap-1 text-[10px]
                    ${isActive ? 'text-lime-400' : 'text-neutral-500'}`}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <main className="relative z-10 flex-1 mb-16 md:mb-0">
                {location.pathname === '/' ? (
                    children
                ) : (
                    <div className="py-8">
                        <Container>
                            {children}
                        </Container>
                    </div>
                )}
            </main>
        </div>
    );
}
