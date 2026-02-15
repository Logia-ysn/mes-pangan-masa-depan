interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
    itemsPerPage?: number;
}

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage
}: PaginationProps) => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * (itemsPerPage || 10) + 1;
    const endItem = Math.min(startItem + (itemsPerPage || 10) - 1, totalItems || 0);

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end === totalPages) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="pagination-container">
            {totalItems !== undefined && (
                <div className="pagination-info">
                    Menampilkan <strong>{startItem}-{endItem}</strong> dari <strong>{totalItems}</strong> data
                </div>
            )}

            <div className="pagination-controls">
                <button
                    className="pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>

                {getPageNumbers().map(p => (
                    <button
                        key={p}
                        className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
                        onClick={() => onPageChange(p)}
                    >
                        {p}
                    </button>
                ))}

                <button
                    className="pagination-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
            </div>
        </div>
    );
};

export default Pagination;
