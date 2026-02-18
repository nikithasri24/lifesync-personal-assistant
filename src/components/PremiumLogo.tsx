/**
 * PremiumLogo Component
 * Now using Life Weave branding with basket weave pattern
 */

import LifeWeaveLogo from './LifeWeaveLogo';

interface PremiumLogoProps {
  collapsed?: boolean;
  className?: string;
}

export default function PremiumLogo({ collapsed = false, className = '' }: PremiumLogoProps) {
  return <LifeWeaveLogo collapsed={collapsed} className={className} size="medium" variant="light" />;
}
