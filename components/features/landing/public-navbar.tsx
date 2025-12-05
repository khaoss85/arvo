'use client';

import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, Dumbbell, Code2, Sparkles, Users, Building2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

interface PublicNavbarProps {
  isAuthenticated?: boolean;
}

export function PublicNavbar({ isAuthenticated = false }: PublicNavbarProps) {
  const t = useTranslations('landing.navbar');
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [idealForOpen, setIdealForOpen] = useState(false);
  const [mobileIdealForOpen, setMobileIdealForOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle scroll for sticky behavior
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIdealForOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setIdealForOpen(false);
    setMobileIdealForOpen(false);
  }, [pathname]);

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: '/features', label: t('features') },
    { href: '/pricing', label: t('pricing') },
  ];

  const idealForItems = [
    { href: '/pro', label: t('idealFor.athletes'), icon: Dumbbell, description: t('idealFor.athletesDesc') },
    { href: '/', label: t('idealFor.techSavvy'), icon: Code2, description: t('idealFor.techSavvyDesc') },
    { href: '/lite', label: t('idealFor.casual'), icon: Sparkles, description: t('idealFor.casualDesc') },
    { href: '/for-trainers', label: t('idealFor.trainers'), icon: Users, description: t('idealFor.trainersDesc') },
    { href: '/for-gyms', label: t('idealFor.gyms'), icon: Building2, description: t('idealFor.gymsDesc') },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || mobileMenuOpen
          ? 'bg-background/95 backdrop-blur-md shadow-sm border-b border-border/50'
          : 'bg-transparent'
      }`}
    >
      <div className="container max-w-6xl mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo size="sm" showTagline={false} animated={false} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {/* Nav Links */}
            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(link.href)
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Ideal For Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIdealForOpen(!idealForOpen)}
                  className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary ${
                    idealForOpen || ['/pro', '/lite', '/for-trainers', '/for-gyms'].includes(pathname)
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {t('idealFor.title')}
                  <ChevronDown className={`w-4 h-4 transition-transform ${idealForOpen ? 'rotate-180' : ''}`} />
                </button>

                {idealForOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-background border border-border rounded-lg shadow-lg py-2 z-50">
                    {idealForItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors ${
                            isActive(item.href) ? 'bg-muted' : ''
                          }`}
                        >
                          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button variant="default" size="sm">
                    {t('dashboard')}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      {t('login')}
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="default" size="sm">
                      {t('getStarted')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary px-2 py-2 ${
                    isActive(link.href)
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile Ideal For Accordion */}
              <div className="border-t border-border/50 pt-2 mt-2">
                <button
                  onClick={() => setMobileIdealForOpen(!mobileIdealForOpen)}
                  className={`w-full flex items-center justify-between text-sm font-medium transition-colors hover:text-primary px-2 py-2 ${
                    mobileIdealForOpen || ['/pro', '/lite', '/for-trainers'].includes(pathname)
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {t('idealFor.title')}
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileIdealForOpen ? 'rotate-180' : ''}`} />
                </button>

                {mobileIdealForOpen && (
                  <div className="pl-4 space-y-1 mt-1">
                    {idealForItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors ${
                            isActive(item.href) ? 'bg-muted' : ''
                          }`}
                        >
                          <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                          <span className="text-sm">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-border/50 mt-2">
                {isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button variant="default" className="w-full">
                      {t('dashboard')}
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="outline" className="w-full">
                        {t('login')}
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="default" className="w-full">
                        {t('getStarted')}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
