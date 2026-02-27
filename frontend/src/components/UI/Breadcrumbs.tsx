import React from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
    label: string;
    to?: string;
    active?: boolean;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
    if (!items || items.length === 0) return null;

    return (
        <nav className="breadcrumbs-container" aria-label="Breadcrumb" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 0',
            marginBottom: '16px',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)'
        }}>
            {/* Leading Arrow */}
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>
                chevron_right
            </span>

            {items.map((item, index) => (
                <React.Fragment key={index}>
                    {index > 0 && (
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>
                            chevron_right
                        </span>
                    )}

                    {item.to && !item.active ? (
                        <Link
                            to={item.to}
                            style={{
                                color: 'var(--text-secondary)',
                                textDecoration: 'none',
                                transition: 'color 0.2s',
                                fontWeight: index === items.length - 1 ? 600 : 400
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span style={{
                            color: 'var(--text-primary)',
                            fontWeight: 600
                        }}>
                            {item.label}
                        </span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};

export default Breadcrumbs;
