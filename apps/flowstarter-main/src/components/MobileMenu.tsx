'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const menuItems = [
    { href: '/', label: 'Home' },
    { href: '/templates', label: 'Templates' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/about', label: 'About' },
  ];

  return (
    <div className="lg:hidden">
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="p-2 text-gray-600 hover-text-gray-900 focus:outline-none"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex h-full flex-col items-center justify-center space-y-6">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xl font-medium text-gray-900 hover-text-gray-600"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMenu;
