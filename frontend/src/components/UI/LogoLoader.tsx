import React from 'react';
import logo from '../../assets/logo_pmd_white.png';
import './LogoLoader.css';

interface LogoLoaderProps {
    fullScreen?: boolean;
    small?: boolean;
    text?: string;
}

const LogoLoader: React.FC<LogoLoaderProps> = ({
    fullScreen = false,
    small = false,
    text = 'Memuat...'
}) => {
    const containerStyle: React.CSSProperties = fullScreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100vh',
        width: '100vw',
        zIndex: 9999,
        background: 'var(--bg-body)'
    } : {
        height: small ? '200px' : '60vh'
    };

    return (
        <div className={`logo-loader-container ${small ? 'small' : ''}`} style={containerStyle}>
            <div className={`logo-loader-wrapper ${small ? 'small' : ''}`}>
                <div className="logo-loader-pulse"></div>
                <div className="logo-loader-ring"></div>
                <img src={logo} alt="PMD Logo" className="logo-loader-img" />
            </div>
            {text && <div className="logo-loader-text" style={small ? { fontSize: '0.8rem' } : {}}>{text}</div>}
        </div>
    );
};

export default LogoLoader;
