import React from 'react';

interface GlassPanelProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'subtle' | 'card' | 'solid';
    hover?: boolean;
    glow?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const paddingMap = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
};

const roundedMap = {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    '2xl': 'rounded-3xl'
};

export const GlassPanel: React.FC<GlassPanelProps> = ({
    children,
    className = '',
    variant = 'default',
    hover = false,
    glow = false,
    padding = 'md',
    rounded = 'xl'
}) => {
    const baseStyles = `
    backdrop-blur-xl
    border border-white/[0.08]
    transition-all duration-300
  `;

    const variantStyles = {
        default: 'bg-[rgba(15,15,25,0.6)] shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
        subtle: 'bg-[rgba(15,15,25,0.4)] backdrop-blur-md border-white/[0.05]',
        card: 'bg-[rgba(15,15,25,0.6)] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]',
        solid: 'bg-[#0f0f18] border-white/[0.1]'
    };

    const hoverStyles = hover
        ? 'hover:border-white/[0.15] hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
        : '';

    const glowStyles = glow
        ? 'relative before:absolute before:inset-[-2px] before:bg-gradient-to-r before:from-indigo-500 before:via-purple-500 before:to-pink-500 before:rounded-inherit before:opacity-0 before:blur-xl before:transition-opacity hover:before:opacity-30 before:-z-10'
        : '';

    return (
        <div
            className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${hoverStyles}
        ${glowStyles}
        ${paddingMap[padding]}
        ${roundedMap[rounded]}
        ${className}
      `}
        >
            {children}
        </div>
    );
};

export default GlassPanel;
