// Header.tsx - MAIN COMPONENT
import React from 'react';
import DesktopHeader from './DesktopHeader';
import MobileHeader from './MobileHeader';

interface HeaderProps {
  onMenuToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  return (
    <>
      {/* Mobile Header - Only shows on mobile */}
      <MobileHeader onMenuToggle={onMenuToggle || (() => {})} />
      
      {/* Desktop Header - Only shows on desktop */}
      <DesktopHeader />
    </>
  );
};

export default Header;